import { WalletClient } from 'viem';
import { sendCalls } from 'viem/actions';
import { getAction } from 'viem/utils';
import { HexString } from '../../types';

export type BatchCallParams = {
  to: HexString;
  data: HexString;
  value?: bigint;
};

/**
 * Send batch transactions using EIP-5792 via Viem experimental sendCalls
 */
export async function sendBatchCalls(walletClient: WalletClient, calls: BatchCallParams[]): Promise<{ id: string } | null> {
  try {
    const result = await getAction(
      walletClient,
      sendCalls,
      'sendCalls',
    )({
      account: walletClient.account!,
      calls: calls.map((call) => ({
        to: call.to,
        data: call.data,
        value: call.value ?? BigInt(0),
      })),
    });
    return result;
  } catch (error) {
    console.warn('EIP-5792 batch calls not supported:', error);
    return null;
  }
}
