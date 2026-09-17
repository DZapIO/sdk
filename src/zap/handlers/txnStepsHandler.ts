import { Signer } from 'ethers';
import { WalletClient } from 'viem';
import { broadcastZapTx } from '../../api';
import { chainTypes } from '../../constants/chains';
import { StatusCodes, TxnStatus } from '../../enums';
import GenericTxnHandler from '../../transactionHandlers/generic';
import { DZapTransactionResponse, HexString } from '../../types';
import { isZapTxnStep, ZapBroadcastStepData, ZapSignStepData, ZapTransactionStep, ZapTxnDetails, ZapTxnStepAction } from '../../types/zap/step';
import { getPublicClient, getSignerAddress } from '../../utils';
import { handleViemTransactionError } from '../../utils/errors';
import { signCustomTypedData } from '../../utils/signIntent/custom';
import { zapSignStepKind, zapStepAction } from '../constants/step';

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

  public static handleSignStep = async ({ data, signer }: { data: ZapSignStepData; signer: Signer | WalletClient }) => {
    if (data.kind !== zapSignStepKind.limitOrder) {
      throw new Error(`Unsupported sign step kind: ${data.kind}. Only ${zapSignStepKind.limitOrder} steps can be signed by the SDK.`);
    }
    const { domain, types, message, primaryType } = data.typedData;
    return await signCustomTypedData({
      signer,
      account: await getSignerAddress(signer),
      domain,
      types,
      message,
      primaryType,
    });
  };

  public static handleBroadcastStep = async ({ data, signature }: { data: ZapBroadcastStepData; signature?: HexString }) => {
    const { txnId, chainId, payload } = data;

    const response = await broadcastZapTx({
      txId: txnId,
      chainId,
      txData: { payload: { ...(payload as Record<string, unknown>), signature } },
    });

    if (response.status !== TxnStatus.success) {
      throw new Error(response.data?.message || 'Failed to broadcast the zap order.');
    }

    return { txnHash: response.data.txnHash };
  };

  private static processTxnStep = async ({
    step,
    chainId,
    signer,
    rpcUrls,
  }: {
    step: { action: ZapTxnStepAction; data: ZapTxnDetails };
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
      let pendingSignature: HexString | undefined;

      for (const step of steps) {
        if (isZapTxnStep(step)) {
          const isApproval = step.action === zapStepAction.approve;
          const result = await ZapTxnStepsHandler.processTxnStep({ step, chainId, signer, rpcUrls });
          if (result.status !== TxnStatus.success) {
            return result;
          }
          if (!isApproval) {
            txnHash = result.txnHash;
          }
          continue;
        }

        if (step.action === zapStepAction.sign) {
          const result = await ZapTxnStepsHandler.handleSignStep({ data: step.data, signer });
          if (result.status !== TxnStatus.success || !result.data) {
            return result as DZapTransactionResponse;
          }
          pendingSignature = result.data.signature;
          continue;
        }

        const result = await ZapTxnStepsHandler.handleBroadcastStep({ data: step.data, signature: pendingSignature });
        // The signature belongs to the order just submitted; it must not leak into a later broadcast.
        pendingSignature = undefined;
        txnHash = result.txnHash ?? txnHash;
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
