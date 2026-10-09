import { Signer } from 'ethers';
import { WalletClient } from 'viem';
import { chainTypes } from '../../constants/chains';
import { StatusCodes, TxnStatus } from '../../enums';
import GenericTxnHandler from '../../transactionHandlers/generic';
import { DZapTransactionResponse, HexString } from '../../types';
import { StepAction, ZapTransactionStep, ZapTxnDetails } from '../../types/zap/step';
import { getPublicClient, getSignerAddress } from '../../utils';
import { handleViemTransactionError } from '../../utils/errors';
import { zapStepAction } from '../constants/step';

export type ZapStepsResult =
  | {
      status: TxnStatus.success;
      code: StatusCodes | number;
      txnHash?: string;
    }
  | DZapTransactionResponse;

type TxnStepHandlerParams = {
  chainId: number;
  txnData: ZapTxnDetails;
  signer: Signer | WalletClient;
  rpcUrls?: string[];
};

class ZapTxnStepsHandler {
  private static sendTxnStep = async ({
    chainId,
    txnData,
    signer,
  }: {
    chainId: number;
    txnData: ZapTxnDetails;
    signer: Signer | WalletClient;
  }): Promise<DZapTransactionResponse> => {
    if (txnData.type !== chainTypes.evm) {
      throw new Error(`Zap steps on ${txnData.type} chains cannot be executed with an EVM signer.`);
    }
    const from = await getSignerAddress(signer);
    return await GenericTxnHandler.sendTransaction({
      chainId,
      signer,
      from,
      to: txnData.callTo,
      data: txnData.callData,
      value: txnData.value,
      gasLimit: txnData.estimatedGas,
    });
  };

  public static handleExecuteStep = async ({
    chainId,
    txnData,
    signer,
  }: {
    chainId: number;
    txnData: ZapTxnDetails;
    signer: Signer | WalletClient;
  }): Promise<DZapTransactionResponse> => {
    return await ZapTxnStepsHandler.sendTxnStep({ chainId, txnData, signer });
  };

  public static handleApproveStep = async ({
    chainId,
    txnData,
    signer,
    rpcUrls,
  }: {
    chainId: number;
    txnData: ZapTxnDetails;
    signer: Signer | WalletClient;
    rpcUrls?: string[];
  }): Promise<DZapTransactionResponse> => {
    const result = await ZapTxnStepsHandler.sendTxnStep({ chainId, txnData, signer });
    if (result.status !== TxnStatus.success) {
      return result;
    }
    await getPublicClient({ chainId, rpcUrls }).waitForTransactionReceipt({ hash: result.txnHash as HexString });
    return result;
  };

  private static txnStepHandlers: Record<StepAction, (params: TxnStepHandlerParams) => Promise<DZapTransactionResponse>> = {
    [zapStepAction.approve]: ({ chainId, txnData, signer, rpcUrls }) => ZapTxnStepsHandler.handleApproveStep({ chainId, txnData, signer, rpcUrls }),
    [zapStepAction.execute]: ({ chainId, txnData, signer }) => ZapTxnStepsHandler.handleExecuteStep({ chainId, txnData, signer }),
  };

  private static processTxnStep = async ({
    step,
    ...params
  }: Omit<TxnStepHandlerParams, 'txnData'> & { step: ZapTransactionStep }): Promise<DZapTransactionResponse> => {
    const handler = ZapTxnStepsHandler.txnStepHandlers[step.action];
    if (!handler) {
      return {
        status: TxnStatus.error,
        code: StatusCodes.FunctionNotFound,
        errorMsg: `Unsupported zap step action: ${String(step.action)}`,
      };
    }
    return handler({ ...params, txnData: step.data });
  };

  public static handle = async ({
    chainId,
    steps,
    signer,
    rpcUrls,
  }: {
    chainId: number;
    steps: ZapTransactionStep[];
    signer: Signer | WalletClient;
    rpcUrls?: string[];
  }): Promise<ZapStepsResult> => {
    try {
      let txnHash: string | undefined;

      for (const step of steps) {
        const result = await ZapTxnStepsHandler.processTxnStep({ step, chainId, signer, rpcUrls });
        if (result.status !== TxnStatus.success) {
          return result;
        }
        if (step.action !== zapStepAction.approve) {
          txnHash = result.txnHash;
        }
      }

      if (!txnHash) {
        return {
          status: TxnStatus.error,
          code: StatusCodes.Error,
          errorMsg: 'No executable steps found.',
        };
      }

      return { status: TxnStatus.success, code: StatusCodes.Success, txnHash };
    } catch (error: unknown) {
      console.log({ error });
      return handleViemTransactionError({ error });
    }
  };
}

export default ZapTxnStepsHandler;
