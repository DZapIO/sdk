import { fetchZapBuildTxnData, fetchZapBundleBuildTx } from '../api';
import { chainTypes } from '../constants/chains';
import { StatusCodes, TxnStatus } from '../enums';
import { WaitForTxnResponse } from '../types';
import { DZapSigner } from '../types/signer';
import { ZapBuildTxnRequest, ZapBuildTxnResponse, ZapBundleRequest } from '../types/zap';
import { ZapStep, ZapTransactionResponse } from '../types/zap/step';
import { DZapTxnError, toTxnErrorResponse } from '../utils/errors';
import { zapStepAction } from '../zap/constants/step';
import { getChainAdapterFor } from './adapters';

// a step whose settlement is not known yet is left for the caller to wait on, as sending it again could execute it twice
const pendingStep = (receipt: WaitForTxnResponse, remainingSteps: ZapStep[]): ZapTransactionResponse => ({
  status: TxnStatus.mining,
  code: StatusCodes.TransactionNotConfirmed,
  errorMsg: 'A zap step was not confirmed in time. Wait for txnHash to settle, then call zap again with remainingSteps',
  txnHash: receipt.txnHash,
  remainingSteps,
  ...(receipt.error ? { error: receipt.error } : {}),
});

class ZapTxnHandler {
  /**
   * Builds the zap unless `steps` are given, and sends its execute steps in order, each with the adapter
   * of the chain type the step names.
   */
  public static zap = async ({
    request,
    steps,
    signer,
    rpcUrls,
  }: {
    request: ZapBuildTxnRequest | ZapBundleRequest;
    steps?: ZapStep[];
    signer: DZapSigner;
    rpcUrls?: string[];
  }): Promise<ZapTransactionResponse> => {
    try {
      const chainId = 'srcChainId' in request ? request.srcChainId : request.actions?.[0]?.srcChainId;
      if (chainId === undefined) {
        throw new DZapTxnError(StatusCodes.InvalidRequest, 'The zap request has no source chain');
      }
      if (!steps?.length) {
        const route: ZapBuildTxnResponse =
          'actions' in request ? (await fetchZapBundleBuildTx(request)).data : (await fetchZapBuildTxnData(request)).data;
        steps = route.steps;
      }

      const executeSteps = (steps ?? []).filter((step) => step.action === zapStepAction.execute);
      if (!executeSteps.length) {
        throw new DZapTxnError(StatusCodes.InvalidRequest, 'The zap route has no steps to execute');
      }

      let txnHash = '';
      for (const [index, step] of executeSteps.entries()) {
        const adapter = getChainAdapterFor(step.data.type ?? chainTypes.evm, signer);
        ({ txnHash } = await adapter.sendZapStep({ chainId, signer, step: step.data, rpcUrls }));
        // a send resolves once broadcast, so a step settles before the next one; the last is left to waitForTransaction
        if (index === executeSteps.length - 1) break;
        const receipt = await adapter.waitForTransaction({ chainId, txnHash, rpcUrls });
        if (receipt.status === TxnStatus.reverted) {
          throw new DZapTxnError(StatusCodes.ContractExecutionError, 'Zap step failed on chain', { txnHash });
        }
        if (receipt.status !== TxnStatus.success) {
          return pendingStep(receipt, executeSteps.slice(index + 1));
        }
      }
      return { status: TxnStatus.success, code: StatusCodes.Success, txnHash };
    } catch (error) {
      console.log({ error });
      return toTxnErrorResponse(error);
    }
  };
}

export default ZapTxnHandler;
