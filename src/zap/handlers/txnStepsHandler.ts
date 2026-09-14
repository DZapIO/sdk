import { Signer } from 'ethers';
import { WalletClient } from 'viem';
import { chainTypes } from '../../constants/chains';
import { StatusCodes, TxnStatus } from '../../enums';
import GenericTxnHandler from '../../transactionHandlers/generic';
import { DZapTransactionResponse, HexString } from '../../types';
import { ZapTransactionStep, ZapTxnDetails } from '../../types/zap/step';
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

  private static processTxnStep = async ({
    step,
    chainId,
    signer,
    rpcUrls,
  }: {
    step: ZapTransactionStep;
    chainId: number;
    signer: Signer | WalletClient;
    rpcUrls?: string[];
  }): Promise<DZapTransactionResponse> => {
    return step.action === zapStepAction.approve
      ? ZapTxnStepsHandler.handleApproveStep({ chainId, txnData: step.data, signer, rpcUrls })
      : ZapTxnStepsHandler.handleExecuteStep({ chainId, txnData: step.data, signer });
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
