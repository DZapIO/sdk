import type { Client } from '@bigmi/core';
import type { SuiClient } from '@mysten/sui/client';
import type { Commitment } from '@solana/web3.js';
import type { Connection } from '@solana/web3.js';
import type { Signer } from 'ethers';
import type { PublicClient } from 'viem';
import type { WalletClient } from 'viem';

import type { TxnStatus } from '../../enums';
import type { AvailableDZapServices, HexString } from '../../types';
import type { DZapTransactionResponse, EvmTxData, GaslessTradeBuildTxnResponse, TradeBuildTxnRequest, TradeBuildTxnResponse } from '../../types';
import type { ZapBuildTxnResponse } from '../../types/zap/build';
import type { ZapBuildTxnPayload } from '../../types/zap/step';
import type { BitcoinSigner } from './bitcoin';
import type { SolanaSigner } from './solana';
import type { SuiWallet } from './sui';

/**
 * Union of all supported signers. Use when a method accepts any chain signer (e.g. trade.execute).
 * EVM: Signer | WalletClient; Solana: SolanaSigner; Sui: SuiWallet; Bitcoin: BitcoinSigner.
 */
export type DZapSigner = Signer | WalletClient | SolanaSigner | SuiWallet | BitcoinSigner;

export type TokenBalance = {
  contract: string;
  balance: bigint;
};

export type GetBalanceParams = {
  chainId: number;
  account: string;
  tokenAddresses?: string[];
};

/**
 * Union of all transaction data types accepted by sendTransaction across chains.
 * Used as default TTxnData when IChainClient is used without generic params.
 */
export type DZapTxnData = EvmTxData | GaslessTradeBuildTxnResponse | TradeBuildTxnResponse | ZapBuildTxnResponse | ZapBuildTxnPayload;

/**
 * Params for sendTransaction. Generic TSigner and TTxnData make param types deterministic per chain implementation:
 * EvmChain → Signer | WalletClient + EvmTxData | ..., SolanaChain → SolanaSigner + TradeBuildTxnResponse, etc.
 */
export type SendTransactionParams<TSigner extends DZapSigner = DZapSigner, TTxnData extends DZapTxnData = DZapTxnData> = {
  chainId: number;
  txnData: TTxnData | undefined;
  paramsReq?: TradeBuildTxnRequest;
  signer: TSigner;
  service?: AvailableDZapServices;
};

export type WaitForReceiptParams = {
  txHash: HexString;
  chainId: number;
  additionalData?: unknown; // e.g. signedTx, blockhash for Solana
};

export type TransactionReceipt = {
  status: TxnStatus;
  txHash?: HexString;
  error?: unknown;
};

/** Options for getPublicClient: rpcUrls (all chains), commitment (Solana only) */
export type PublicClientOptions = {
  rpcUrls?: string[];
  commitment?: Commitment;
};

/** Union of public client types returned by each chain's getPublicClient */
export type ChainPublicClient = PublicClient | Connection | SuiClient | Client;

/**
 * Chain client interface. Generics make return/param types deterministic per chain implementation:
 * TPublicClient: getPublicClient return (Evm → PublicClient, Solana → Connection, etc.)
 * TSigner: sendTransaction signer (Evm → Signer | WalletClient, Solana → SolanaSigner, etc.)
 * TTxnData: sendTransaction txnData (Evm → EvmTxData | ..., Solana → TradeBuildTxnResponse, etc.)
 */
export type IChainClient<
  TPublicClient extends ChainPublicClient = ChainPublicClient,
  TSigner extends DZapSigner = DZapSigner,
  TTxnData extends DZapTxnData = DZapTxnData,
> = {
  /**
   * Fetches token balances for an account
   * @param params - Balance fetching parameters
   * @returns Promise resolving to array of token balances
   */
  getBalance(params: GetBalanceParams): Promise<TokenBalance[]>;

  /**
   * Sends a transaction on the chain
   * @param params - Transaction sending parameters
   * @returns Promise resolving to transaction response
   */
  sendTransaction(params: SendTransactionParams<TSigner, TTxnData>): Promise<DZapTransactionResponse>;

  /**
   * Waits for transaction confirmation
   * @param params - Receipt waiting parameters
   * @returns Promise resolving to transaction receipt
   */
  waitForTransactionReceipt(params: WaitForReceiptParams): Promise<TransactionReceipt>;

  /**
   * Gets the chain type identifier (e.g., 'svm', 'suivm', 'bvm')
   */
  getChainType(): string;

  /**
   * Gets supported chain IDs for this ecosystem
   */
  getSupportedChainIds(): number[];

  /**
   * Validates if a chain ID is supported by this ecosystem
   */
  isChainSupported(chainId: number): boolean;

  /**
   * Returns a public/read-only client for the chain. Return type is deterministic per implementation:
   * EvmChain → PublicClient, SolanaChain → Connection, SuiChain → SuiClient, BitcoinChain → Client.
   * @param chainId - Chain ID
   * @param options - Optional rpcUrls, commitment (Solana)
   */
  getPublicClient(chainId: number, options?: PublicClientOptions): TPublicClient;
};
