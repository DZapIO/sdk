import { Signer } from 'ethers';
import { WalletClient } from 'viem';
import { broadcastTradeTx } from '../api';
import { StatusCodes, TxnStatus } from '../enums';
import { AdditionalInfo, HexString, HyperLiquidBroadcastTxData, TradeBuildTxnResponse } from '../types';
import { signCustomTypedData } from '../utils/signIntent/custom';

export class HyperLiquidTxHandler {
  static sendTransaction = async (
    signer: Signer | WalletClient,
    account: HexString,
    txnData: TradeBuildTxnResponse,
    chainId: number,
    additionalInfo: AdditionalInfo | undefined,
    updatedQuotes: Record<string, string>,
  ) => {
    const signTypedData = 'signTypedData' in txnData.transaction ? txnData.transaction.signTypedData : null;

    if (!signTypedData) {
      return {
        status: TxnStatus.error,
        errorMsg: 'Missing typed data for HyperLiquid transaction',
        code: StatusCodes.Error,
      };
    }

    const txData: HyperLiquidBroadcastTxData[] = [];
    for (let i = 0; i < signTypedData.length; i++) {
      const typedData = signTypedData[i];
      const [resp, signatureChainId] = await Promise.all([
        signCustomTypedData({
          signer,
          account,
          domain: typedData.domain,
          types: typedData.types,
          message: typedData.message,
          primaryType: typedData.primaryType,
        }),
        signer.getChainId(),
      ]);
      if (resp.status !== TxnStatus.success || !resp.data?.signature) {
        throw new Error('Failed to sign transaction');
      }

      txData.push({
        primaryType: typedData.primaryType,
        message: typedData.message,
        signature: resp.data.signature,
        account,
        signatureChainId,
      });
    }

    const txResp = await broadcastTradeTx({
      chainId,
      txData,
      txId: txnData.txId,
    });

    if (txResp.status !== TxnStatus.success) {
      throw new Error('Failed to broadcast or save transaction');
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
