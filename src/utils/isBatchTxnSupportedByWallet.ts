import { Client, withTimeout } from 'viem';
import { getCapabilities } from 'viem/actions';
import { getAction } from 'viem/utils';

/**
 * Check if wallet supports EIP-5792 batch transactions with enhanced checking
 * @param client - The wallet client
 * @param chainId - The chain ID
 * @param skipReady - Whether to skip the ready check
 * @returns True if the wallet supports EIP-5792 batch transactions, false otherwise
 */
export async function isBatchTxnSupportedByWallet({
  client,
  chainId,
  skipReady = false,
}: {
  client: Client;
  chainId: number;
  skipReady?: boolean;
}): Promise<boolean> {
  try {
    const capabilities = await withTimeout(async () => await getAction(client, getCapabilities, 'getCapabilities')({ chainId }), {
      timeout: 2000,
      errorInstance: new Error('Timeout'),
    });
    return (
      capabilities?.atomicBatch?.supported ||
      capabilities?.atomic?.status === 'supported' ||
      (!skipReady && capabilities?.atomic?.status === 'ready') ||
      false
    );
  } catch {
    /**
     * @dev If the wallet does not support getCapabilities or the call fails
     * we assume that atomic batch is not supported */
    return false;
  }
}
