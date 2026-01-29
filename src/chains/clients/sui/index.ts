import type { CoinBalance } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { fromBase64 } from '@mysten/sui/utils';

import { chainIds, chainTypes } from '../../../constants';
import { StatusCodes, TxnStatus } from '../../../enums';
import { ChainsService } from '../../../service/chains';
import type { DZapTransactionResponse, HexString } from '../../../types';
import { parseError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { BaseChainClient } from '../base';
import type { GetBalanceParams, SendTransactionParams, TokenBalance, TransactionReceipt, WaitForReceiptParams } from '../types';

/**
 * Sui wallet interface for signing and executing transactions
 */
export type SuiWallet = {
  signAndExecuteTransaction(
    params: { transaction: Transaction },
    options: {
      execute: (params: { bytes: Uint8Array; signature: string }) => Promise<{ digest: string }>;
    },
  ): Promise<{ digest: string }>;
};

/**
 * Sui ecosystem chain implementation
 * Handles Sui transaction operations and balance fetching.
 * Uses ChainsService.getSuiClient(chainId) for RPC client.
 */
export class SuiChain extends BaseChainClient {
  constructor() {
    super(chainTypes.suivm, [chainIds.sui]); // Sui chain ID
  }

  /**
   * Fetches token balances for a Sui account
   */
  async getBalance(params: GetBalanceParams): Promise<TokenBalance[]> {
    const { chainId, account, tokenAddresses = [] } = params;
    const suiClient = ChainsService.getPublicSuiClient(chainId);

    try {
      const coinBalances = await suiClient.getAllBalances({
        owner: account,
      });

      if (tokenAddresses.length === 0) {
        const balancesMap = new Map<string, bigint>();
        coinBalances.forEach((coin: CoinBalance) => {
          const current = balancesMap.get(coin.coinType) || BigInt(0);
          balancesMap.set(coin.coinType, current + BigInt(coin.totalBalance));
        });
        return Array.from(balancesMap.entries()).map(([contract, balance]) => ({
          contract,
          balance,
        }));
      }

      // Filter and aggregate balances for requested tokens
      const balances: TokenBalance[] = tokenAddresses.map((tokenAddress) => {
        const filteredCoins = coinBalances.filter((coin: CoinBalance) => coin.coinType === tokenAddress);
        const totalBalance = filteredCoins.reduce((acc: bigint, coin: CoinBalance) => acc + BigInt(coin.totalBalance), BigInt(0));
        return { contract: tokenAddress, balance: totalBalance };
      });

      return balances;
    } catch {
      return tokenAddresses.length > 0 ? tokenAddresses.map((address) => ({ contract: address, balance: BigInt(0) })) : [];
    }
  }

  /**
   * Sends a Sui transaction
   */
  async sendTransaction(params: SendTransactionParams<typeof chainIds.sui>): Promise<DZapTransactionResponse> {
    const { chainId, txnData, signer } = params;
    const suiClient = ChainsService.getPublicSuiClient(chainId);

    try {
      if (!txnData || !('data' in txnData)) {
        throw new Error('Unsupported transaction data');
      }

      const data = txnData.data;

      if (!signer || !data) {
        return { code: StatusCodes.Error, status: TxnStatus.error };
      }

      const serializedData = fromBase64(data);
      const tx = Transaction.from(serializedData);

      const resData = await signer.signAndExecuteTransaction(
        {
          transaction: tx,
        },
        {
          execute: async ({ bytes, signature }) => {
            return await suiClient.executeTransactionBlock({
              transactionBlock: bytes,
              signature,
              options: {
                showRawEffects: true,
                showObjectChanges: true,
                showBalanceChanges: true,
              },
            });
          },
        },
      );

      return {
        code: StatusCodes.Success,
        status: TxnStatus.success,
        txnHash: resData.digest as HexString,
      };
    } catch (error) {
      return {
        ...parseError(error),
        error,
      };
    }
  }

  /**
   * Waits for Sui transaction confirmation
   */
  async waitForTransactionReceipt(params: WaitForReceiptParams): Promise<TransactionReceipt> {
    const { chainId, txHash } = params;
    const suiClient = ChainsService.getPublicSuiClient(chainId);

    try {
      const startTime = Date.now();
      const timeout = 30000; // 30 seconds
      const pollingInterval = 1000; // 1 second

      while (true) {
        try {
          const txnDetails = await suiClient.getTransactionBlock({
            digest: txHash,
            options: { showEffects: true },
          });

          const status = txnDetails?.effects?.status?.status;
          if (status === TxnStatus.success) {
            return { status: TxnStatus.success, txHash };
          }
          if (status === 'failure') {
            return { status: TxnStatus.error, txHash };
          }
        } catch (error) {
          // Transaction may not be available yet; continue polling
          logger.debug('Sui transaction not yet available, continuing to poll', { txHash, error });
        }

        if (Date.now() - startTime > timeout) {
          return { status: TxnStatus.error, txHash, error: new Error('Transaction confirmation timeout') };
        }

        await new Promise((resolve) => setTimeout(resolve, pollingInterval));
      }
    } catch (error) {
      return { status: TxnStatus.error, txHash, error };
    }
  }
}
