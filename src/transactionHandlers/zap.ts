import type { Signer } from 'ethers';
import type { WalletClient } from 'viem';

import { fetchZapBuildTxnData } from '../api';
import { viemChainsById } from '../chains';
import { ZAP_STEP_ACTIONS } from '../constants';
import { StatusCodes, TxnStatus } from '../enums';
import type { DZapTransactionResponse, HexString } from '../types';
import type { ZapBuildTxnRequest, ZapBuildTxnResponse } from '../types/zap';
import type { ZapEvmTxnDetails, ZapStep } from '../types/zap/step';
import { getPublicClient, isTypeSigner } from '../utils';
import { handleViemTransactionError } from '../utils/errors';

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

  public static approve = async ({ chainId, data, signer }: { chainId: number; data: ZapEvmTxnDetails; signer: Signer | WalletClient }) => {
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
        if (step.action === ZAP_STEP_ACTIONS.execute) {
          const result = await ZapTxnHandler.execute({ chainId, txnData: step.data as ZapEvmTxnDetails, signer });
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
