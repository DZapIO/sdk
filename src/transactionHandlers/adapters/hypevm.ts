import { broadcastTradeTx } from '../../api';
import { StatusCodes, TxnStatus } from '../../enums';
import { HexString, HyperLiquidBroadcastTxData } from '../../types';
import { EvmSigner } from '../../types/signer';
import { isEvmSigner } from '../../utils';
import { DZapTxnError } from '../../utils/errors';
import { signTypedData } from '../../utils/signTypedData';
import { ChainAdapter } from './types';

const onlyTrades = () => Promise.reject(new DZapTxnError(StatusCodes.InvalidRequest, 'Hyperliquid only supports trades'));

/**
 * Hyperliquid actions are not transactions: the user signs them as typed data and the DZap API submits them.
 */
export const hypevmAdapter: ChainAdapter<EvmSigner> = {
  isSigner: isEvmSigner,

  sendTrade: async ({ chainId, signer, txnData }) => {
    const typedDataToSign = 'signTypedData' in txnData.transaction ? txnData.transaction.signTypedData : undefined;
    if (!typedDataToSign?.length) {
      throw new DZapTxnError(StatusCodes.InvalidRequest, 'Missing typed data for HyperLiquid transaction');
    }

    const account = txnData.from as HexString;
    const txData: HyperLiquidBroadcastTxData[] = [];
    for (const typedData of typedDataToSign) {
      const [signature, signatureChainId] = await Promise.all([signTypedData({ signer, account, ...typedData }), signer.getChainId()]);
      txData.push({
        primaryType: typedData.primaryType,
        message: typedData.message,
        signature,
        account,
        signatureChainId,
      });
    }

    const response = await broadcastTradeTx({ chainId, txData, txId: txnData.txId });
    if (response.status !== TxnStatus.success) {
      throw new DZapTxnError(StatusCodes.Error, response.message || 'Failed to broadcast transaction');
    }
    return { txnHash: response.txnHash };
  },

  sendTransaction: onlyTrades,
  sendZapStep: onlyTrades,

  // an action is settled once the API submitted it
  waitForTransaction: async ({ txnHash }) => ({ status: TxnStatus.success, txnHash }),
};
