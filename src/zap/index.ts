import { Signer } from 'ethers';
import { StatusCodes, TxnStatus } from 'src/enums';
import { DZapTransactionResponse, HexString } from 'src/types';
import { initializeReadOnlyProvider, isTypeSigner } from 'src/utils';
import { viemChainsById } from 'src/utils/chains';
import { handleViemTransactionError } from 'src/utils/errors';
import { WalletClient } from 'viem';
import { zapStepAction } from './constants/step';
import { ZapStep, ZapTxnDetails } from './types/step';

class ZapHandler {
  private static instance: ZapHandler;

  public static getInstance(): ZapHandler {
    if (!ZapHandler.instance) {
      ZapHandler.instance = new ZapHandler();
    }
    return ZapHandler.instance;
  }

  public async execute({
    chainId,
    data,
    signer,
  }: {
    chainId: number;
    data: ZapTxnDetails;
    signer: Signer | WalletClient;
  }): Promise<DZapTransactionResponse> {
    try {
      const { callData, callTo, value, estimatedGas } = data;
      const publicClient = initializeReadOnlyProvider({ chainId, rpcUrls: undefined });
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
          gasLimit: BigInt(estimatedGas),
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
  }

  public async zap({ chainId, data, signer }: { chainId: number; data: ZapStep[]; signer: Signer | WalletClient }) {
    try {
      let txnHash: HexString | undefined;
      for (let i = 0; i < data.length; i++) {
        const step = data[i];
        if (step.action === zapStepAction.execute) {
          const result = await this.execute({ chainId, data: step.data as ZapTxnDetails, signer });
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
  }
}

export default ZapHandler;
