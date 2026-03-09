import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import type { Blockhash, BlockhashWithExpiryBlockHeight, SendOptions, SignatureResult } from '@solana/web3.js';
import { clusterApiUrl, Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';
import { fromByteArray, toByteArray } from 'base64-js';
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

function decodeBase64ToUint8Array(base64: string): Uint8Array {
  return toByteArray(base64);
}

function encodeUint8ArrayToBase64(bytes: Uint8Array): string {
  return fromByteArray(bytes);
}

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

export type SolanaSingleTransactionResponse = {
  type?: 'single';
  signedTx: VersionedTransaction;
  latestBlockhash: {
    blockhash: Blockhash;
    lastValidBlockHeight: number;
  };
};

export type SolanaJitoBundleResponse = {
  type: 'jito';
  signedTxs: VersionedTransaction[];
  latestBlockhash: {
    blockhash: Blockhash;
    lastValidBlockHeight: number;
  };
};

export type SolanaTransactionResponse = SolanaSingleTransactionResponse | SolanaJitoBundleResponse;

export type ConfirmedTransactionResult = {
  signatureResult: SignatureResult | null;
  txnHash: string;
};

export type SolanaSendBundleFn = (serializedBase64Txs: string[]) => Promise<string>;

export type SolanaSigner = {
  /**
   * Sign a single Solana versioned transaction.
   */
  signTransaction(transaction: VersionedTransaction): Promise<VersionedTransaction>;
  /**
   * Optional: sign multiple transactions in a single call (used for Jito bundles).
   */
  signAllTransactions?(transactions: VersionedTransaction[]): Promise<VersionedTransaction[]>;
  /**
   * Optional: submit a bundle of base64-encoded transactions to a Jito endpoint.
   * Should resolve with a bundle ID string.
   */
  sendBundle?: SolanaSendBundleFn;
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

      let latestBlockhash: BlockhashWithExpiryBlockHeight;
      if (txnData.blockhash && txnData.lastValidBlockHeight) {
        latestBlockhash = {
          blockhash: txnData.blockhash,
          lastValidBlockHeight: txnData.lastValidBlockHeight,
        };
      } else {
        try {
          latestBlockhash = await connection.getLatestBlockhash(SolanaCommitment.confirmed);
        } catch (blockhashError) {
          const message = blockhashError instanceof Error ? blockhashError.message : String(blockhashError);
          const isRpcError = message.includes('undefined') || message.includes('StructError') || message.includes('get recent blockhash');
          if (isRpcError) {
            throw new TransactionError(
              StatusCodes.Error,
              `Solana RPC failed to return blockhash. Ensure a valid RPC is configured via DZapClient.getInstance({ rpcUrlsByChainId: { 7565164: ['your-rpc-url'] } }) or NEXT_PUBLIC_SOLANA_RPC_URI. Public RPCs may be rate-limited. Original: ${message}`,
            );
          }
          throw blockhashError;
        }
      }

      if (Array.isArray(txnData.data) || txnData.type === 'jito') {
        return this.sendJitoBundle({
          txnData,
          signer,
          latestBlockhash,
        });
      }

      return this.sendSingleTransaction({
        txnData,
        signer,
        latestBlockhash,
      });
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
      if (!data || !data.latestBlockhash) {
        throw new ValidationError('Missing Solana transaction data for receipt');
      }

      if (data.type === 'jito') {
        return this.waitForJitoBundleReceipt(params.chainId, data);
      }

      return this.waitForSingleTransactionReceipt(params.chainId, data);
    } catch (error) {
      logger.error('Failed to wait for Solana transaction', { service: 'SolanaChain', method: 'waitForTransactionReceipt', txHash, error });
      return { status: TxnStatus.error, error };
    }
  }

  /**
   * Handles Jito bundle flow: decode, sign all, submit bundle, and build response.
   */
  private async sendJitoBundle(params: {
    txnData: SvmTxData;
    signer: SolanaSigner;
    latestBlockhash: BlockhashWithExpiryBlockHeight;
  }): Promise<DZapTransactionResponse & { svmTxnData?: SolanaTransactionResponse }> {
    const { txnData, signer, latestBlockhash } = params;

    if (!signer.signAllTransactions) {
      throw new ValidationError('Jito bundle is not supported: signer.signAllTransactions is not available');
    }
    if (!signer.sendBundle) {
      throw new ValidationError('Jito bundle is not supported: signer.sendBundle is not available');
    }

    const dataArray = Array.isArray(txnData.data) ? txnData.data : [txnData.data];

    const transactions = dataArray.map((base64: string) => {
      const serializedData = decodeBase64ToUint8Array(base64);
      const tx = VersionedTransaction.deserialize(serializedData);
      tx.message.recentBlockhash = latestBlockhash.blockhash;
      return tx;
    });

    const signedTxs = await withTimeout<VersionedTransaction[]>(() => signer.signAllTransactions!(transactions), {
      timeout: 60_000,
      errorInstance: new TransactionError(StatusCodes.Timeout, 'Transaction signing expired'),
    });

    const serializedBase64 = signedTxs.map((tx) => encodeUint8ArrayToBase64(tx.serialize()));
    await withTimeout(() => signer.sendBundle!(serializedBase64), {
      timeout: 60_000,
      errorInstance: new TransactionError(StatusCodes.Timeout, 'Bundle submission expired'),
    });

    const firstSignature = signedTxs[0]?.signatures?.[0];
    if (!firstSignature) {
      throw new ValidationError('Signed bundle has no signatures');
    }

    const txnHash = bs58.encode(firstSignature);
    return {
      code: StatusCodes.Success,
      status: TxnStatus.success,
      txnHash: txnHash as HexString,
      svmTxnData: {
        type: 'jito',
        signedTxs,
        latestBlockhash,
      },
    };
  }

  /**
   * Handles single Solana transaction flow: decode, sign, and build response.
   */
  private async sendSingleTransaction(params: {
    txnData: SvmTxData;
    signer: SolanaSigner;
    latestBlockhash: BlockhashWithExpiryBlockHeight;
  }): Promise<DZapTransactionResponse & { svmTxnData?: SolanaTransactionResponse }> {
    const { txnData, signer, latestBlockhash } = params;

    const serializedData = decodeBase64ToUint8Array(txnData.data as string);
    const versionedTransaction = VersionedTransaction.deserialize(serializedData);
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
        type: 'single',
        signedTx,
        latestBlockhash,
      },
    };
  }

  /**
   * Waits for confirmation of the first transaction in a Jito bundle.
   */
  private async waitForJitoBundleReceipt(chainId: number, data: SolanaJitoBundleResponse): Promise<TransactionReceipt> {
    if (!data.signedTxs || data.signedTxs.length === 0) {
      throw new ValidationError('Missing signed transactions for Jito bundle receipt');
    }
    const firstTx = data.signedTxs[0];
    const confirmedTx = await this.executeTransactionWithRetry(chainId, firstTx, data.latestBlockhash);

    if (!confirmedTx.signatureResult || confirmedTx.signatureResult.err) {
      return { status: TxnStatus.error };
    }

    return {
      status: TxnStatus.success,
      txHash: confirmedTx.txnHash as HexString,
    };
  }

  /**
   * Waits for confirmation of a single Solana transaction.
   */
  private async waitForSingleTransactionReceipt(chainId: number, data: SolanaTransactionResponse): Promise<TransactionReceipt> {
    if (!('signedTx' in data) || !data.signedTx) {
      throw new ValidationError('Missing signed Solana transaction for receipt');
    }

    const confirmedTx = await this.executeTransactionWithRetry(chainId, data.signedTx, data.latestBlockhash);

    if (!confirmedTx.signatureResult || confirmedTx.signatureResult.err) {
      return { status: TxnStatus.error };
    }

    return {
      status: TxnStatus.success,
      txHash: confirmedTx.txnHash as HexString,
    };
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
