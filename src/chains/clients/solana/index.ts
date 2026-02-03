import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import type { Blockhash, BlockhashWithExpiryBlockHeight, SendOptions, SignatureResult } from '@solana/web3.js';
import { clusterApiUrl, Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';
import { withTimeout } from 'viem';

import { config } from '../../../config';
import { CHAIN_NATIVE_TOKENS, chainIds, chainTypes } from '../../../constants';
import { StatusCodes, TxnStatus } from '../../../enums';
import type { DZapTransactionResponse, HexString, SvmTxData } from '../../../types';
import { NotFoundError, parseError, TransactionError, ValidationError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { BaseChainClient } from '../base';
import type { GetBalanceParams, PublicClientOptions, SendTransactionParams, TokenBalance, TransactionReceipt, WaitForReceiptParams } from '../types';

/**
 * Solana (SVM) chain implementation.
 * getPublicClient returns Solana Connection.
 */
export enum SolanaCommitment {
  processed = 'processed',
  confirmed = 'confirmed',
  finalized = 'finalized',
  recent = 'recent',
  single = 'single',
  singleGossip = 'singleGossip',
  root = 'root',
  max = 'max',
}

export type SolanaTransactionResponse = {
  signedTx: VersionedTransaction;
  latestBlockhash: {
    blockhash: Blockhash;
    lastValidBlockHeight: number;
  };
};

export type ConfirmedTransactionResult = {
  signatureResult: SignatureResult | null;
  txnHash: string;
};

export type SolanaSigner = {
  signTransaction(transaction: VersionedTransaction): Promise<VersionedTransaction>;
};

export class SolanaClient extends BaseChainClient {
  constructor() {
    super(chainTypes.svm, [chainIds.solana]);
  }

  getPublicClient(chainId: number, options?: PublicClientOptions): Connection {
    const rpcUrls = options?.rpcUrls ?? config.getRpcUrlsByChainId(chainId);
    const rpc = rpcUrls?.[0] ?? clusterApiUrl('mainnet-beta');
    const commitment = options?.commitment ?? 'confirmed';
    return new Connection(rpc, commitment);
  }

  async getBalance(params: GetBalanceParams): Promise<TokenBalance[]> {
    const { chainId, account, tokenAddresses = [] } = params;
    const connection = this.getPublicClient(chainId);

    try {
      const userAccount = new PublicKey(account);
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

  async sendTransaction(
    params: SendTransactionParams<SolanaSigner, SvmTxData>,
  ): Promise<DZapTransactionResponse & { svmTxnData?: SolanaTransactionResponse }> {
    const { chainId, txnData, signer } = params;
    try {
      if (!txnData || !txnData.data) {
        throw new ValidationError('Unsupported transaction data');
      }
      const connection = this.getPublicClient(chainId);

      const serializedData = new Uint8Array(Buffer.from(txnData.data, 'base64'));
      const versionedTransaction = VersionedTransaction.deserialize(serializedData);

      let latestBlockhash: BlockhashWithExpiryBlockHeight;
      if (txnData.blockhash && txnData.lastValidBlockHeight) {
        latestBlockhash = {
          blockhash: txnData.blockhash,
          lastValidBlockHeight: txnData.lastValidBlockHeight,
        };
      } else {
        latestBlockhash = await connection.getLatestBlockhash(SolanaCommitment.confirmed);
      }

      versionedTransaction.message.recentBlockhash = latestBlockhash.blockhash;

      const signedTx = await withTimeout<VersionedTransaction>(() => signer.signTransaction(versionedTransaction), {
        timeout: 60_000,
        errorInstance: new TransactionError(StatusCodes.Timeout, 'Transaction signing expired'),
      });

      const signature = signedTx.signatures?.[0];
      if (signature === undefined) {
        throw new ValidationError('Signed transaction has no signatures');
      }

      const txnHash = bs58.encode(signature);
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
      logger.error('Solana transaction failed', { method: 'sendTransaction', error, txnData });
      return {
        ...parseError(error, true),
      };
    }
  }

  async waitForTransactionReceipt(params: WaitForReceiptParams): Promise<TransactionReceipt> {
    const { txHash, additionalData } = params;

    try {
      const data = additionalData as SolanaTransactionResponse | undefined;
      if (!data?.signedTx || !data?.latestBlockhash) {
        throw new ValidationError('Missing Solana transaction data for receipt');
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

  private async executeTransactionWithRetry(
    chainId: number,
    signedTx: VersionedTransaction,
    blockhashResult: BlockhashWithExpiryBlockHeight,
  ): Promise<ConfirmedTransactionResult> {
    const connection = this.getPublicClient(chainId);
    const signedTxSerialized = signedTx.serialize();
    const txnHash = bs58.encode(signedTx.signatures[0]);
    if (!txnHash) {
      throw new NotFoundError('Transaction hash not found');
    }

    const rawTransactionOptions: SendOptions = {
      skipPreflight: true,
      maxRetries: 2,
      preflightCommitment: SolanaCommitment.confirmed,
    };

    let signatureResult: SignatureResult | null = null;
    let blockHeight = await connection.getBlockHeight(SolanaCommitment.confirmed);

    while (!signatureResult && blockHeight < blockhashResult.lastValidBlockHeight) {
      try {
        await connection.sendRawTransaction(signedTxSerialized, rawTransactionOptions);
      } catch (error) {
        // Log transient RPC errors but continue retry loop until blockheight expiration
        logger.warn('sendRawTransaction failed, retrying', {
          txnHash,
          error,
        });
      }
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
