import { fetchZapBuildTxnData, fetchZapBundleBuildTx } from '../api';
import { chainTypes } from '../constants/chains';
import { StatusCodes, TxnStatus } from '../enums';
import { DZapTransactionResponse, HexString } from '../types';
import { DZapSigner } from '../types/signer';
import { ZapBuildTxnRequest, ZapBuildTxnResponse, ZapBundleRequest } from '../types/zap';
import { ZapStep } from '../types/zap/step';
import { DZapTxnError, toTxnErrorResponse } from '../utils/errors';
import { zapStepAction } from '../zap/constants/step';
import { getChainAdapterFor } from './adapters';

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
  }): Promise<DZapTransactionResponse> => {
    try {
      const chainId = 'srcChainId' in request ? request.srcChainId : request.actions[0].srcChainId;
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
      for (const step of executeSteps) {
        const adapter = getChainAdapterFor(step.data.type ?? chainTypes.evm, signer);
        ({ txnHash } = await adapter.sendZapStep({ chainId, signer, step: step.data, rpcUrls }));
      }
      return { status: TxnStatus.success, code: StatusCodes.Success, txnHash: txnHash as HexString };
    } catch (error) {
      console.log({ error });
      return toTxnErrorResponse(error);
    }
  };
}

export default ZapTxnHandler;
