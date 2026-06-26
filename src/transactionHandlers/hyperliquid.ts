import { Signer } from 'ethers';
import { WalletClient } from 'viem';
import { broadcastTradeTx } from '../api';
import { StatusCodes, TxnStatus } from '../enums';
import { AdditionalInfo, HexString, HyperLiquidBroadcastTxData, TradeBuildTxnResponse } from '../types';
import { signCustomTypedData } from '../utils/signIntent/custom';

export class HyperLiquidTxHandler {
  static sendTransaction = async (
    signer: Signer | WalletClient,
    txnParams: { from: string; to: string; data: string; value: string; gasLimit?: string },
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
      const resp = await signCustomTypedData({
        signer,
        account: txnParams.from as HexString,
        domain: typedData.domain,
        types: typedData.types,
        message: typedData.message,
        primaryType: typedData.primaryType,
      });
      if (resp.status !== TxnStatus.success) {
        throw new Error('Failed to sign transaction');
      }

      txData.push({
        primaryType: typedData.primaryType as string,
        message: typedData.message,
        signature: resp.data?.signature as HexString,
        account: txnParams.from as HexString,
        signatureChainId: await signer.getChainId(),
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
