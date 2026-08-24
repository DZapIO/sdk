import { Signer } from 'ethers';
import { WalletClient } from 'viem';
import { fetchZapBuildTxnData, fetchZapBundleBuildTx } from '../api';
import { StatusCodes, TxnStatus } from '../enums';
import { DZapTransactionResponse } from '../types';
import { ZapBuildTxnRequest, ZapBuildTxnResponse, ZapBundleRequest } from '../types/zap';
import { ZapEvmTxnDetails, ZapPreExecutionStep, ZapStep } from '../types/zap/step';
import { handleViemTransactionError } from '../utils/errors';
import ZapPreExecutionStepHandler from '../zap/handlers/preExecutionStepHandler';
import ZapTxnStepsHandler, { ZapStepsResult } from '../zap/handlers/txnStepsHandler';

class ZapTxnHandler {
  public static execute = async ({
    chainId,
    txnData,
    signer,
  }: {
    chainId: number;
    txnData: ZapEvmTxnDetails;
    signer: Signer | WalletClient;
  }): Promise<DZapTransactionResponse> => {
    try {
      return await ZapTxnStepsHandler.handleExecuteStep({ chainId, txnData, signer });
    } catch (error: unknown) {
      console.log({ error });
      return handleViemTransactionError({ error });
    }
  };

  public static approve = async ({
    chainId,
    data,
    signer,
  }: {
    chainId: number;
    data: ZapEvmTxnDetails;
    signer: Signer | WalletClient;
  }): Promise<DZapTransactionResponse> => {
    try {
      return await ZapTxnStepsHandler.handleApproveStep({ chainId, txnData: data, signer });
    } catch (error: unknown) {
      console.log({ error });
      return handleViemTransactionError({ error });
    }
  };

  /**
   * Runs a zap end to end: pre-execution steps, then buildTx, then the steps it returns.
   *
   * `preExecutionSteps` come from a quote. Their signatures are sent with the buildTx request as
   * `preExecutionStepsData`, which some routes (1inch limit orders, Aave borrows) require before
   * they can be built at all — so they are handled before anything is built, and skipping them is
   * only safe when the quote didn't ask for any.
   *
   * Passing `steps` skips the build and runs them directly; in that case any pre-execution steps
   * must already have been folded into the request that produced them.
   */
  public static zap = async ({
    request,
    steps,
    preExecutionSteps,
    signer,
  }: {
    request: ZapBuildTxnRequest | ZapBundleRequest;
    steps?: ZapStep[];
    preExecutionSteps?: ZapPreExecutionStep[];
    signer: Signer | WalletClient;
  }): Promise<ZapStepsResult> => {
    try {
      const chainId = 'srcChainId' in request ? request.srcChainId : request.actions[0].srcChainId;
      let buildRequest = request;

      if (preExecutionSteps?.length) {
        const preExecutionResult = await ZapPreExecutionStepHandler.handle({ steps: preExecutionSteps, signer });
        if (preExecutionResult.status !== TxnStatus.success || !('preExecutionStepsData' in preExecutionResult)) {
          return preExecutionResult;
        }
        buildRequest = { ...request, preExecutionStepsData: preExecutionResult.preExecutionStepsData };
      }

      if (!steps || steps.length === 0) {
        const route: ZapBuildTxnResponse =
          'actions' in buildRequest ? (await fetchZapBundleBuildTx(buildRequest)).data : (await fetchZapBuildTxnData(buildRequest)).data;
        steps = route.steps;
        if (!steps || steps.length === 0) {
          return {
            status: TxnStatus.error,
            code: StatusCodes.FunctionNotFound,
            errorMsg: 'No steps found in the zap route.',
          };
        }
      }

      return await ZapTxnStepsHandler.handle({ chainId, steps, signer });
    } catch (error: unknown) {
      console.log({ error });
      return handleViemTransactionError({ error });
    }
  };
}

export default ZapTxnHandler;
