import { HexString } from 'src/types';
import { type WalletClient } from 'viem';
import { encodeApproveCallData } from '../encodeApproveCall';
import { getAllowance } from '../erc20';
import { isDZapNativeToken } from '../index';
import { BatchCallParams, sendBatchCalls } from './sendBatchCalls';

/**
 * Generates approval batch calls for tokens that need approval
 */
export async function generateApprovalBatchCalls({
  tokens,
  chainId,
  sender,
  spender,
  rpcUrls,
}: {
  tokens: Array<{
    address: HexString;
    amount: string;
  }>;
  chainId: number;
  sender: HexString;
  spender: HexString;
  rpcUrls?: string[];
}): Promise<BatchCallParams[]> {
  const tokensToCheck = tokens.filter((token) => !isDZapNativeToken(token.address));
  if (tokensToCheck.length === 0) {
    return [];
  }
  const { data: allowanceData } = await getAllowance({
    chainId,
    sender,
    tokens: tokensToCheck,
    spender,
    rpcUrls,
  });

  const tokensNeedingApproval = tokensToCheck.filter((token) => allowanceData[token.address]?.approvalNeeded);

  return tokensNeedingApproval.map((token) => ({
    to: token.address,
    data: encodeApproveCallData({
      spender,
      amount: BigInt(token.amount),
    }),
    value: BigInt(0),
  }));
}

/**
 * Batch approve multiple tokens using EIP-5792 if supported.
 */
export async function batchApproveTokens(
  walletClient: WalletClient,
  tokens: Array<{
    address: HexString;
    amount: string;
  }>,
  chainId: number,
  spender: HexString,
  sender: HexString,
  rpcUrls?: string[],
): Promise<{ success: boolean; batchId?: string }> {
  const approveCalls = await generateApprovalBatchCalls({
    tokens,
    chainId,
    sender,
    spender,
    rpcUrls,
  });
  if (approveCalls.length === 0) {
    return { success: true };
  }
  const batchResult = await sendBatchCalls(walletClient, approveCalls);
  return {
    success: Boolean(batchResult),
    batchId: batchResult?.id,
  };
}
