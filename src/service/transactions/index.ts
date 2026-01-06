import { Signer } from 'ethers';
import { type Client, WalletClient } from 'viem';
import { sendCalls, waitForCallsStatus } from 'viem/actions';
import { getAction } from 'viem/utils';
import { StatusCodes, TxnStatus } from '../../enums';
import { BatchCallParams, DZapTransactionResponse, EvmTxData, HexString } from '../../types';
import { WalletCallReceipt } from '../../types/wallet';
import { isTypeSigner } from '../../utils';
import { viemChainsById } from '../../chains';
import { handleViemTransactionError } from '../../utils/errors';

/**
 * TransactionsService handles generic transaction operations including sending, decoding, and batch transactions.
 */
export class TransactionsService {
  /**
   * Sends a pre-built transaction using the provided signer and transaction data.
   * This method handles the actual blockchain interaction for transaction execution.
   * Use this when you have already built transaction data and want to execute it.
   *
   * @param params - Configuration object for transaction sending
   * @param params.chainId - The blockchain network ID where the transaction will be executed
   * @param params.signer - The wallet signer (ethers Signer or viem WalletClient) to sign and send the transaction
   * @param params.txnData - Complete transaction data including calldata, value, and gas parameters
   * @returns Promise resolving to the transaction execution result
   *
   * @example
   * ```typescript
   * const result = await client.transactions.send({
   *   chainId: 1,
   *   signer: walletClient,
   *   txnData: {
   *     to: '0x...',
   *     data: '0x...',
   *     value: '0',
   *     gasLimit: '21000'
   *   }
   * });
   * ```
   */
  public async send({ chainId, signer, txnData }: { chainId: number; signer: Signer | WalletClient; txnData: EvmTxData }) {
    return await TransactionsService.sendTransaction({
      signer,
      chainId,
      ...txnData,
    });
  }

  /**
   * Waits for a batch transaction to be mined and returns the transaction receipt.
   *
   * @param params - Configuration object for transaction sending
   * @param params.walletClient - The wallet client
   * @param params.batchHash - The hash of the batch transaction
   * @returns Promise resolving to the transaction execution result
   *
   * @example
   * ```typescript
   * const result = await client.transactions.waitForBatch({
   *   walletClient: walletClient,
   *   batchHash: '0x...',
   * });
   * ```
   */
  public async waitForBatchTransactionReceipt({ walletClient, batchHash }: { walletClient: WalletClient; batchHash: HexString }) {
    return await TransactionsService.waitForBatchReceipt(walletClient, batchHash);
  }

  /**
   * Send batch calls
   * @param params
   * @param params.walletClient - The wallet client
   * @param params.calls - The calls to send
   * @returns Promise resolving to batch call result
   *
   * @example
   * ```typescript
   * const calls  = [{
   *   to: '0x...',
   *   data: '0x...',
   *   value: 0n,
   * }]
   * const result = await client.transactions.sendBatch({
   *   walletClient: walletClient,
   *   calls,
   * });
   * ```
   */
  public async sendBatch({ walletClient, calls }: { walletClient: WalletClient; calls: BatchCallParams[] }) {
    return await TransactionsService.sendBatchCalls(walletClient, calls);
  }

  /**
   * Sends a transaction using either ethers or viem signer.
   * This is a static utility method that can be used across services.
   */
  public static async sendTransaction({
    chainId,
    signer,
    from,
    to,
    data,
    value,
    gasLimit,
  }: {
    chainId: number;
    signer: Signer | WalletClient;
    from?: HexString;
    to: HexString;
    data: HexString;
    value: string | bigint;
    gasLimit?: string | bigint;
  }): Promise<DZapTransactionResponse> {
    try {
      if (isTypeSigner(signer)) {
        console.log('Using ethers signer.');
        const fromAddress = from || (await signer.getAddress());
        const txnRes = await signer.sendTransaction({
          from: fromAddress,
          to,
          data,
          value: typeof value === 'string' ? value : value.toString(),
          gasLimit: gasLimit ? (typeof gasLimit === 'string' ? gasLimit : gasLimit.toString()) : undefined,
        });
        return {
          status: TxnStatus.success,
          code: StatusCodes.Success,
          txnHash: txnRes.hash as HexString,
        };
      } else {
        console.log('Using viem walletClient.');
        const txnHash = await signer.sendTransaction({
          chain: viemChainsById[chainId],
          account: (from || signer.account?.address) as HexString,
          to: to as HexString,
          data: data as HexString,
          value: typeof value === 'string' ? BigInt(value) : value,
          gas: gasLimit ? (typeof gasLimit === 'string' ? BigInt(gasLimit) : gasLimit) : undefined,
        });
        return {
          status: TxnStatus.success,
          code: StatusCodes.Success,
          txnHash,
        };
      }
    } catch (error: any) {
      console.log({ error });
      return handleViemTransactionError({ error });
    }
  }

  /**
   * Send batch transactions using EIP-5792 via Viem experimental sendCalls
   */
  public static async sendBatchCalls(
    walletClient: WalletClient,
    calls: Array<{
      to: HexString;
      data: HexString;
      value?: bigint;
    }>,
  ): Promise<{ id: string } | null> {
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

  /**
   * Wait for batch transaction receipt using EIP-5792
   */
  public static async waitForBatchReceipt(client: Client, batchHash: HexString): Promise<WalletCallReceipt> {
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
  }
}
