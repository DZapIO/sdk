import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import type { Blockhash, BlockhashWithExpiryBlockHeight, SendOptions, SignatureResult } from '@solana/web3.js';
import { PublicKey, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';
import { withTimeout } from 'viem';

import { chainIds, chainTypes } from '../../../constants';
import { CHAIN_NATIVE_TOKENS } from '../../../constants';
import { StatusCodes, TxnStatus } from '../../../enums';
import { ChainsService } from '../../../service/chains';
import type { DZapTransactionResponse, HexString, TradeBuildTxnResponse } from '../../../types';
import { parseError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { BaseChainClient } from '../base';
import type { GetBalanceParams, SendTransactionParams, TokenBalance, TransactionReceipt, WaitForReceiptParams } from '../types';

/**
 * Commitment level for Solana transactions
 */
export enum SolanaCommitment {
  processed = 'processed',
  confirmed = 'confirmed',
  finalized = 'finalized',
}

/**
 * Solana transaction response with additional metadata
 */
export type SolanaTransactionResponse = {
  signedTx: VersionedTransaction;
  latestBlockhash: {
    blockhash: Blockhash;
    lastValidBlockHeight: number;
  };
};

/**
 * Confirmed transaction result
 */
export type ConfirmedTransactionResult = {
  signatureResult: SignatureResult | null;
  txnHash: string;
};

/**
 * Solana wallet adapter interface for signing transactions
 */
export type SolanaSigner = {
  signTransaction(transaction: VersionedTransaction): Promise<VersionedTransaction>;
};

/**
 * Solana ecosystem chain implementation
 * Handles Solana (SVM) transaction operations and balance fetching.
 * Uses ChainsService.getSolanaClient(chainId) for RPC connection.
 */
export class SolanaChain extends BaseChainClient {
  constructor() {
    super(chainTypes.svm, [chainIds.solana]); // Solana chain ID
  }

  /**
   * Fetches token balances for a Solana account
   */
  async getBalance(params: GetBalanceParams): Promise<TokenBalance[]> {
    const { chainId, account, tokenAddresses = [] } = params;
    const connection = ChainsService.getPublicSolanaClient(chainId);
    const userAccount = new PublicKey(account);

    try {
      const tokenAccountsPromise = connection.getParsedTokenAccountsByOwner(userAccount, {
        programId: TOKEN_PROGRAM_ID,
      });

      const nativeTokenAddress = CHAIN_NATIVE_TOKENS.SOLANA;
      const shouldFetchNative = tokenAddresses.length === 0 || tokenAddresses.includes(nativeTokenAddress);

      const nativeBalancePromise = shouldFetchNative ? connection.getBalance(userAccount) : Promise.resolve(0);

      const [tokenAccountsResult, nativeBalanceResult] = await Promise.allSettled([tokenAccountsPromise, nativeBalancePromise]);

      const splBalances: { [mint: string]: bigint } = {};
      if (tokenAccountsResult.status === 'fulfilled') {
        tokenAccountsResult.value.value.forEach(({ account: { data } }) => {
          const parsedInfo = data.parsed.info;
          const mint = parsedInfo.mint;
          const amount = BigInt(parsedInfo.tokenAmount.amount);
          if (amount > BigInt(0)) {
            splBalances[mint] = splBalances[mint] ? splBalances[mint] + amount : amount;
          }
        });
      }

      const addressesToFetch = tokenAddresses.length > 0 ? tokenAddresses : [nativeTokenAddress];
      const results: TokenBalance[] = addressesToFetch.map((address) => {
        if (address === nativeTokenAddress) {
          return {
            contract: address,
            balance: nativeBalanceResult.status === 'fulfilled' ? BigInt(nativeBalanceResult.value) : BigInt(0),
          };
        }
        return {
          contract: address,
          balance: splBalances[address] || BigInt(0),
        };
      });

      return results;
    } catch (error) {
      logger.error('Failed to fetch Solana balances', { service: 'SolanaChain', method: 'getBalance', account, error });
      return tokenAddresses.length > 0
        ? tokenAddresses.map((address) => ({ contract: address, balance: BigInt(0) }))
        : [{ contract: CHAIN_NATIVE_TOKENS.SOLANA, balance: BigInt(0) }];
    }
  }

  /**
   * Sends a Solana transaction
   */
  async sendTransaction(
    params: SendTransactionParams<typeof chainIds.solana>,
  ): Promise<DZapTransactionResponse & { svmTxnData?: SolanaTransactionResponse }> {
    const { chainId, txnData, signer } = params;

    try {
      if (!txnData || !('data' in txnData)) {
        throw new Error('Gasless transactions not supported on Solana');
      }

      const data = txnData.data;
      const svmTxData = (txnData as TradeBuildTxnResponse).svmTxData;
      const connection = ChainsService.getPublicSolanaClient(chainId);

      if (!signer || !data) {
        return { code: StatusCodes.Error, status: TxnStatus.error };
      }

      const serializedData = new Uint8Array(Buffer.from(data, 'base64'));
      const versionedTransaction = VersionedTransaction.deserialize(serializedData);

      // If svmTxData exists, use it; otherwise fetch latest blockhash
      const latestBlockhash = svmTxData ? svmTxData : await connection.getLatestBlockhash(SolanaCommitment.confirmed);

      versionedTransaction.message.recentBlockhash = latestBlockhash.blockhash;

      // Sign transaction with timeout (60 seconds)
      const signedTx = await withTimeout<VersionedTransaction>(() => signer.signTransaction(versionedTransaction), {
        timeout: 60000,
        errorInstance: new Error('Transaction signing expired'),
      });

      const txnHash = bs58.encode(signedTx.signatures[0]);
      return {
        code: StatusCodes.Success,
        status: TxnStatus.success,
        txnHash: txnHash as HexString,
        svmTxnData: {
          signedTx,
          latestBlockhash,
        },
      };
    } catch (error) {
      logger.error('Solana transaction failed', { service: 'SolanaChain', method: 'sendTransaction', error });
      return {
        ...parseError(error, true),
      };
    }
  }

  /**
   * Waits for Solana transaction confirmation
   */
  async waitForTransactionReceipt(params: WaitForReceiptParams): Promise<TransactionReceipt> {
    const { txHash, additionalData } = params;

    try {
      const data = additionalData as SolanaTransactionResponse | undefined;
      if (!data?.signedTx || !data?.latestBlockhash) {
        logger.error('Missing Solana transaction data', { service: 'SolanaChain', method: 'waitForTransactionReceipt' });
        return { status: TxnStatus.error };
      }

      const confirmedTx = await this.executeTransactionWithRetry(params.chainId, data.signedTx, data.latestBlockhash);

      if (!confirmedTx.signatureResult || confirmedTx.signatureResult.err) {
        return { status: TxnStatus.error };
      }

      return {
        status: TxnStatus.success,
        txHash: confirmedTx.txnHash as HexString,
      };
    } catch (error) {
      logger.error('Failed to wait for Solana transaction', { service: 'SolanaChain', method: 'waitForTransactionReceipt', txHash, error });
      return { status: TxnStatus.error, error };
    }
  }

  /**
   * Executes transaction with retry logic
   * @private
   */
  private async executeTransactionWithRetry(
    chainId: number,
    signedTx: VersionedTransaction,
    blockhashResult: BlockhashWithExpiryBlockHeight,
  ): Promise<ConfirmedTransactionResult> {
    const connection = ChainsService.getPublicSolanaClient(chainId);
    const signedTxSerialized = signedTx.serialize();
    const txnHash = bs58.encode(signedTx.signatures[0]);
    if (!txnHash) {
      throw new Error('Transaction hash not found');
    }

    const rawTransactionOptions: SendOptions = {
      skipPreflight: true,
      maxRetries: 2,
      preflightCommitment: SolanaCommitment.confirmed,
    };

    let signatureResult: SignatureResult | null = null;
    let blockHeight = await connection.getBlockHeight(SolanaCommitment.confirmed);

    while (!signatureResult && blockHeight < blockhashResult.lastValidBlockHeight) {
      await connection.sendRawTransaction(signedTxSerialized, rawTransactionOptions);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      signatureResult = await Promise.race([
        connection.getSignatureStatus(txnHash).then((result) => result.value),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000)),
      ]);

      if (signatureResult) {
        break;
      }
      blockHeight = await connection.getBlockHeight(SolanaCommitment.confirmed);
    }

    return { signatureResult, txnHash };
  }
}
