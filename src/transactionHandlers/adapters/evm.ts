import { Signer } from 'ethers';
import { WaitForTransactionReceiptTimeoutError, WalletClient } from 'viem';
import { viemChainsById } from '../../chains';
import { StatusCodes, TxnStatus } from '../../enums';
import { EvmTxData, HexString } from '../../types';
import { EvmSigner } from '../../types/signer';
import { ZapEvmTxnDetails } from '../../types/zap/step';
import { getPublicClient, isEvmSigner, isTypeSigner } from '../../utils';
import { generateApprovalBatchCalls } from '../../utils/eip-5792/batchApproveTokens';
import { sendBatchCalls } from '../../utils/eip-5792/sendBatchCalls';
import { waitForBatchTransactionReceipt } from '../../utils/eip-5792/waitForBatchTransactionReceipt';
import { DZapTxnError } from '../../utils/errors';
import { ChainAdapter, SendTradeParams } from './types';

type EvmCall = { from?: string; to: string; data: string; value: string; gasLimit?: string };

const sendCall = async (signer: EvmSigner, call: EvmCall, chainId: number): Promise<{ txnHash: string }> => {
  if (isTypeSigner(signer)) {
    const txnRes = await (signer as Signer).sendTransaction({
      from: call.from ?? (await signer.getAddress()),
      to: call.to,
      data: call.data,
      value: call.value,
      gasLimit: call.gasLimit && BigInt(call.gasLimit) ? call.gasLimit : undefined,
    });
    return { txnHash: txnRes.hash };
  }
  const walletClient = signer as WalletClient;
  const account = (call.from ?? walletClient.account?.address) as HexString;
  const txnHash = await walletClient.sendTransaction({
    chain: viemChainsById[chainId],
    account,
    to: call.to as HexString,
    data: call.data as HexString,
    value: BigInt(call.value),
  });
  return { txnHash };
};

// sends the token approvals and the trade as one EIP-5792 batch, or the trade alone when nothing needs approving
const sendTradeAsBatch = async ({ chainId, signer, request, txnData, rpcUrls, multicallAddress }: SendTradeParams<WalletClient>) => {
  const call = { from: txnData.from, to: txnData.to as string, data: txnData.data, value: txnData.value as string };
  const approvalCalls = await generateApprovalBatchCalls({
    tokens: request.data.map((token) => ({ address: token.srcToken as HexString, amount: token.amount })),
    chainId,
    multicallAddress,
    sender: call.from as HexString,
    spender: call.to as HexString,
    rpcUrls,
  });
  if (approvalCalls.length === 0) {
    return sendCall(signer, call, chainId);
  }

  const batch = await sendBatchCalls(signer, [
    ...approvalCalls,
    { to: call.to as HexString, data: call.data as HexString, value: BigInt(call.value) },
  ]);
  if (!batch) {
    throw new DZapTxnError(StatusCodes.Error, 'The wallet could not send the batch of calls');
  }
  const receipt = await waitForBatchTransactionReceipt(signer, batch.id as HexString);
  return { txnHash: receipt.transactionHash };
};

export const evmAdapter: ChainAdapter<EvmSigner> = {
  isSigner: isEvmSigner,

  sendTrade: (params) => {
    const { chainId, signer, txnData, batchTransaction } = params;
    // ethers signers cannot batch calls
    if (batchTransaction && !isTypeSigner(signer)) {
      return sendTradeAsBatch({ ...params, signer: signer as WalletClient });
    }
    const { from, to, data, value, gasLimit } = txnData;
    return sendCall(signer, { from, to: to as string, data, value: value as string, gasLimit }, chainId);
  },

  sendTransaction: ({ chainId, signer, txnData }) => sendCall(signer, txnData as EvmTxData, chainId),

  sendZapStep: ({ chainId, signer, step }) => {
    const { callTo, callData, value, estimatedGas } = step as ZapEvmTxnDetails;
    return sendCall(signer, { to: callTo, data: callData, value, gasLimit: estimatedGas }, chainId);
  },

  waitForTransaction: async ({ chainId, txnHash, rpcUrls, timeoutMs }) => {
    try {
      const receipt = await getPublicClient({ chainId, rpcUrls }).waitForTransactionReceipt({ hash: txnHash as HexString, timeout: timeoutMs });
      return { status: receipt.status === 'success' ? TxnStatus.success : TxnStatus.reverted, txnHash };
    } catch (error) {
      if (error instanceof WaitForTransactionReceiptTimeoutError) {
        return { status: TxnStatus.mining, txnHash };
      }
      return { status: TxnStatus.error, txnHash, error };
    }
  },
};
