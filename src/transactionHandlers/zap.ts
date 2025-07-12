import { Signer } from 'ethers';
import { StatusCodes, TxnStatus } from 'src/enums';
import { DZapTransactionResponse, HexString } from 'src/types';
import { getPublicClient, isTypeSigner } from 'src/utils';
import { viemChainsById } from 'src/utils/chains';
import { handleViemTransactionError } from 'src/utils/errors';
import { WalletClient } from 'viem';
import { zapStepAction } from '../zap/constants/step';
import { ZapStep, ZapTxnDetails } from '../types/zap/step';
import { ZapBuildTxnRequest, ZapBuildTxnResponse } from 'src/types/zap';
import { fetchZapBuildTxnData } from 'src/api';

class ZapTxnHandler {
  public static execute = async ({
    chainId,
    txnData,
    signer,
  }: {
    chainId: number;
    txnData: ZapTxnDetails;
    signer: Signer | WalletClient;
  }): Promise<DZapTransactionResponse> => {
    try {
      const { callData, callTo, value, estimatedGas } = txnData;
      if (isTypeSigner(signer)) {
        console.log('Using ethers signer.');
        const from = await signer.getAddress();
        const txnRes = await signer.sendTransaction({
          from,
          to: callTo,
          data: callData,
          value: BigInt(value),
          gasLimit: BigInt(estimatedGas) ? BigInt(estimatedGas) : undefined,
        });
        return {
          status: TxnStatus.success,
          code: StatusCodes.Success,
          txnHash: txnRes.hash as HexString,
        };
      } else {
        console.log('Using viem walletClient.');
        const txnHash = await signer.sendTransaction({
          chain: viemChainsById[chainId],
          account: signer.account?.address as HexString,
          to: txnData.callTo,
          data: txnData.callData,
          value: BigInt(txnData.value),
        });
        return {
          status: TxnStatus.success,
          code: StatusCodes.Success,
          txnHash,
        };
      }
    } catch (error: any) {
      console.log({ error });
      return handleViemTransactionError({ error });
    }
  };

  public static approve = async ({ chainId, data, signer }: { chainId: number; data: ZapTxnDetails; signer: Signer | WalletClient }) => {
    try {
      const { callData, callTo, value, estimatedGas } = data;
      const publicClient = getPublicClient({ chainId, rpcUrls: undefined });
      const blockNumber = await publicClient.getBlockNumber();
      console.log('block Number and data');
      console.dir(
        {
          blockNumber,
          ...data,
        },
        { depth: null },
      );
      if (isTypeSigner(signer)) {
        console.log('Using ethers signer.');
        const from = await signer.getAddress();
        const txnRes = await signer.sendTransaction({
          from,
          to: callTo,
          data: callData,
          value: BigInt(value),
          gasLimit: BigInt(estimatedGas) ? BigInt(estimatedGas) : undefined,
        });
        return {
          status: TxnStatus.success,
          code: StatusCodes.Success,
          txnHash: txnRes.hash as HexString,
        };
      } else {
        console.log('Using viem walletClient.');
        const txnHash = await signer.sendTransaction({
          chain: viemChainsById[chainId],
          account: signer.account?.address as HexString,
          to: data.callTo,
          data: data.callData,
          value: BigInt(data.value),
        });
        return {
          status: TxnStatus.success,
          code: StatusCodes.Success,
          txnHash,
        };
      }
    } catch (error: any) {
      console.log({ error });
      return handleViemTransactionError({ error });
    }
  };

  public static zap = async ({
    request,
    steps,
    signer,
  }: {
    request: ZapBuildTxnRequest;
    steps?: ZapStep[];
    signer: Signer | WalletClient;
  }): Promise<
    | {
        status: TxnStatus.success;
        code: StatusCodes | number;
        txnHash: HexString;
      }
    | DZapTransactionResponse
  > => {
    try {
      const { srcChainId: chainId } = request;
      if (!steps || steps.length === 0) {
        const route: ZapBuildTxnResponse = (await fetchZapBuildTxnData(request)).data;
        steps = route.steps;
        if (!steps || steps.length === 0) {
          return {
            status: TxnStatus.error,
            code: StatusCodes.FunctionNotFound,
            errorMsg: 'No steps found in the zap route.',
          };
        }
      }
      let txnHash: HexString | undefined;
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        if (step.action === zapStepAction.execute) {
          const result = await ZapTxnHandler.execute({ chainId, txnData: step.data as ZapTxnDetails, signer });
          if (result.status !== TxnStatus.success) {
            return result;
          }
          txnHash = result.txnHash as HexString;
        }
      }
      return {
        status: TxnStatus.success,
        code: StatusCodes.Success,
        txnHash,
      };
    } catch (error: any) {
      console.log({ error });
      return handleViemTransactionError({ error });
    }
  };
}

export default ZapTxnHandler;
