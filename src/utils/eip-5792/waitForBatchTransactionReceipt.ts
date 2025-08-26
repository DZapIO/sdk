import { type Client } from 'viem';
import { waitForCallsStatus } from 'viem/actions';
import { getAction } from 'viem/utils';
import { TxnStatus } from 'src/enums';
import { HexString } from 'src/types';
import { WalletCallReceipt } from 'src/types/wallet';

export const waitForBatchTransactionReceipt = async (client: Client, batchHash: HexString): Promise<WalletCallReceipt> => {
  const { receipts, status, statusCode } = await getAction(
    client,
    waitForCallsStatus,
    'waitForCallsStatus',
  )({
    id: batchHash,
    timeout: 3_600_000 * 24,
  });

  if (status === TxnStatus.success) {
    if (
      !receipts?.length ||
      !receipts.every((receipt) => receipt.transactionHash) ||
      receipts.some((receipt) => receipt.status === TxnStatus.reverted)
    ) {
      throw new Error('Transaction was reverted.');
    }
    const transactionReceipt = receipts[receipts.length - 1]!;
    return transactionReceipt;
  }
  if (statusCode >= 400 && statusCode < 500) {
    throw new Error('Transaction was canceled.');
  }
  throw new Error('Transaction failed.');
};
