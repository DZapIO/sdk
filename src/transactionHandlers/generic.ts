import { StatusCodes, TxnStatus } from '../enums';
import { DZapTransactionResponse, HexString, TxData, WaitForTxnResponse } from '../types';
import { DZapSigner } from '../types/signer';
import { toTxnErrorResponse } from '../utils/errors';
import { getChainAdapter, getChainAdapterFor } from './adapters';

class GenericTxnHandler {
  /**
   * Sends a prebuilt transaction with the adapter of the chain's type.
   */
  public static sendTransaction = async ({
    chainType,
    chainId,
    signer,
    txnData,
    txId,
    rpcUrls,
  }: {
    chainType: string;
    chainId: number;
    signer: DZapSigner;
    txnData: TxData;
    txId?: string;
    rpcUrls?: string[];
  }): Promise<DZapTransactionResponse> => {
    try {
      const { txnHash } = await getChainAdapterFor(chainType, signer).sendTransaction({ chainId, signer, txnData, txId, rpcUrls });
      return { status: TxnStatus.success, code: StatusCodes.Success, txnHash: txnHash as HexString };
    } catch (error) {
      console.log({ error });
      return toTxnErrorResponse(error);
    }
  };

  /**
   * Waits for a transaction to settle with the adapter of the chain's type.
   */
  public static waitForTransaction = async ({
    chainType,
    chainId,
    txnHash,
    rpcUrls,
    timeoutMs,
  }: {
    chainType: string;
    chainId: number;
    txnHash: string;
    rpcUrls?: string[];
    timeoutMs?: number;
  }): Promise<WaitForTxnResponse> => {
    try {
      return await getChainAdapter(chainType).waitForTransaction({ chainId, txnHash, rpcUrls, timeoutMs });
    } catch (error) {
      return { status: TxnStatus.error, txnHash, error };
    }
  };
}

export default GenericTxnHandler;
