import { Signer } from 'ethers';
import { WalletClient } from 'viem';
import { broadcastTradeTx } from '../api';
import { StatusCodes, TxnStatus } from '../enums';
import { AdditionalInfo, DZapTransactionResponse, HexString, SignTradeBuildTxnResponse } from '../types';
import { signCustomTypedData } from '../utils/signIntent/custom';

/**
 * Handles routes that settle off-chain. Nothing is sent from the caller's wallet: the caller signs
 * the provider's EIP-712 order and the signature goes back to the backend, which submits it to the
 * provider. The hash returned is the provider's order hash, not an on-chain transaction hash.
 */
export class IntentTxHandler {
  static signAndBroadcast = async ({
    signer,
    account,
    txnData,
    chainId,
    additionalInfo,
    updatedQuotes,
  }: {
    signer: Signer | WalletClient;
    account: HexString;
    txnData: SignTradeBuildTxnResponse;
    chainId: number;
    additionalInfo: AdditionalInfo | undefined;
    updatedQuotes: Record<string, string>;
  }): Promise<DZapTransactionResponse> => {
    const { signPayload } = txnData.transaction;

    const resp = await signCustomTypedData({
      signer,
      account,
      domain: signPayload.domain,
      types: signPayload.types,
      message: signPayload.message,
      primaryType: signPayload.primaryType,
    });

    if (resp.status !== TxnStatus.success || !resp.data?.signature) {
      return {
        status: resp.status ?? TxnStatus.error,
        errorMsg: 'Failed to sign the order',
        code: resp.code ?? StatusCodes.Error,
      };
    }

    const txResp = await broadcastTradeTx({
      chainId,
      txId: txnData.txId,
      txData: { signature: resp.data.signature },
    });

    if (txResp.status !== TxnStatus.success) {
      return {
        status: txResp.status,
        errorMsg: txResp.message,
        code: StatusCodes.Error,
      };
    }

    return {
      status: TxnStatus.success,
      code: StatusCodes.Success,
      txnHash: txResp.txnHash as HexString,
      additionalInfo,
      updatedQuotes,
    };
  };
}
