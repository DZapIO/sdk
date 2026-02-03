import type { WalletClient } from 'viem';
import { type Client } from 'viem';

import type { DZapSigner, TransactionReceipt } from '../../chains/clients';
import type { DZapTxnData } from '../../chains/clients';
import { EvmClient, getChainClient } from '../../chains/clients';
import { TxnStatus } from '../../enums';
import type { AvailableDZapServices, DZapTransactionResponse, HexString, TradeBuildTxnRequest } from '../../types';
import type { WalletCallReceipt } from '../../types/wallet';
import { NotFoundError } from '../../utils/errors';

/**
 * TransactionsService handles generic transaction operations including sending, decoding, and batch transactions.
 */
export class TransactionsService {
  /**
   * Sends a pre-built transaction using the provided signer and transaction data.
   * This method routes to the appropriate ecosystem chain based on chainId/chainType.
   *
   * @param params - Configuration object for transaction sending
   * @param params.chainId - The blockchain network ID where the transaction will be executed
   * @param params.signer - The wallet signer (ethers Signer, viem WalletClient, or ecosystem-specific signer)
   * @param params.txnData - Chain-specific transaction data (EvmTxData, SvmTxData, SuiTxData, or BtcTxData)
   * @param params.paramsReq - Optional TradeBuildTxnRequest (required for some non-EVM chains like Bitcoin)
   * @returns Promise resolving to the transaction execution result
   *
   * @example
   * ```typescript
   * // EVM transaction
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
   *
   * // Non-EVM: pass chain-specific tx data (e.g. from trade.buildTxn response .transaction)
   * const result = await client.transactions.send({
   *   chainId: 7565164, // Solana
   *   signer: solanaWallet,
   *   txnData: svmTxData, // SvmTxData
   * });
   *
   * // Bitcoin requires service ('zap' | 'trade') and BtcTxData with data + txId
   * const btcResult = await client.transactions.send({
   *   chainId: 1000,
   *   signer: btcSigner,
   *   txnData: { ...btcTxData, txId: buildResponse.txId },
   *   paramsReq: request,
   *   service: 'trade',
   * });
   * ```
   */
  public async send({
    chainId,
    signer,
    txnData,
    paramsReq,
    service,
  }: {
    chainId: number;
    signer: DZapSigner;
    txnData: DZapTxnData | undefined;
    paramsReq?: TradeBuildTxnRequest;
    service?: AvailableDZapServices;
  }): Promise<DZapTransactionResponse> {
    const chainClient = getChainClient(chainId);
    return await chainClient.sendTransaction({
      chainId,
      txnData,
      paramsReq,
      signer,
      service,
    });
  }

  /**
   * Wait for batch transaction receipt using EIP-5792 (instance method)
   */
  public async waitForBatchTransactionReceipt(client: Client, batchHash: HexString): Promise<WalletCallReceipt> {
    return await new EvmClient().waitForBatchTransactionReceipt(client, batchHash);
  }

  /**
   * Waits for a single transaction receipt.
   * Routes to the appropriate ecosystem implementation based on the chain ID.
   */
  public async waitForTransactionReceipt({
    chainId,
    txHash,
    additionalData,
  }: {
    chainId: number;
    txHash: HexString;
    additionalData?: unknown;
  }): Promise<TransactionReceipt> {
    const chainClient = getChainClient(chainId);
    if (chainClient) {
      return await chainClient.waitForTransactionReceipt({
        chainId,
        txHash,
        additionalData,
      });
    }
    return {
      status: TxnStatus.error,
      txHash,
      error: new NotFoundError(`Unsupported chain: ${chainId}`),
    };
  }

  /**
   * Send batch calls (EVM only)
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
  public async sendBatchCalls(
    walletClient: WalletClient,
    calls: Array<{
      to: HexString;
      data: HexString;
      value?: bigint;
    }>,
  ): Promise<{ id: string } | null> {
    return await new EvmClient().sendBatchCalls(walletClient, calls);
  }
}
