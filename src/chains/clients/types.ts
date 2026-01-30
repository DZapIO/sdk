import type { Signer } from 'ethers';
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
 * Union type of all supported signers across ecosystems.
 * Use this when a method can accept a signer for any chain (e.g. trade.execute).
 * - EVM: ethers Signer | viem WalletClient
 * - Solana: SolanaSigner
 * - Sui: SuiWallet
 * - Bitcoin: BitcoinSigner
 */
export type DZapSigner = Signer | WalletClient | SolanaSigner | SuiWallet | BitcoinSigner;

/**
 * Balance information for a token
 */
export type TokenBalance = {
  contract: string;
  balance: bigint;
};

/**
 * Parameters for fetching balances
 */
export type GetBalanceParams = {
  chainId: number;
  account: string;
  tokenAddresses?: string[];
};

/**
 * Maps chain IDs to their corresponding signer types
 * Chain IDs: Solana=7565164, Sui=19219, Bitcoin=1000, BitcoinTestnet=1001
 */
type ChainIdToSignerMap = {
  7565164: SolanaSigner; // Solana
  19219: SuiWallet; // Sui
  1000: BitcoinSigner; // Bitcoin
  1001: BitcoinSigner; // Bitcoin Testnet
  728126428: Signer | WalletClient; // Tron (EVM-compatible)
  607: Signer | WalletClient; // TON (EVM-compatible)
  116201519: Signer | WalletClient; // Aptos (EVM-compatible)
};

/**
 * Gets the signer type for a given chain ID.
 * For known chain IDs, uses the chain-specific signer; for generic/unknown chains, accepts DZapSigner.
 */
type SignerForChainId<TChainId extends number> = TChainId extends keyof ChainIdToSignerMap ? ChainIdToSignerMap[TChainId] : DZapSigner;

/**
 * Maps chain IDs to their corresponding transaction data types
 * Non-EVM chains use TradeBuildTxnResponse only; EVM chains accept all forms
 */
type ChainIdToTxnDataMap = {
  7565164: TradeBuildTxnResponse; // Solana
  19219: TradeBuildTxnResponse; // Sui
  1000: TradeBuildTxnResponse | ZapBuildTxnResponse | ZapBuildTxnPayload; // Bitcoin (trade or zap)
  1001: TradeBuildTxnResponse | ZapBuildTxnResponse | ZapBuildTxnPayload; // Bitcoin Testnet
  728126428: EvmTxData | GaslessTradeBuildTxnResponse | TradeBuildTxnResponse; // Tron
  607: EvmTxData | GaslessTradeBuildTxnResponse | TradeBuildTxnResponse; // TON
  116201519: EvmTxData | GaslessTradeBuildTxnResponse | TradeBuildTxnResponse; // Aptos
};

/**
 * Gets the transaction data type for a given chain ID
 */
type TxnDataForChainId<TChainId extends number> = TChainId extends keyof ChainIdToTxnDataMap
  ? ChainIdToTxnDataMap[TChainId]
  : EvmTxData | GaslessTradeBuildTxnResponse | TradeBuildTxnResponse | ZapBuildTxnResponse | ZapBuildTxnPayload; // Default for unknown chains

/**
 * Parameters for sending transactions
 * The signer and txnData types are inferred based on the chainId
 */
export type SendTransactionParams<TChainId extends number = number> = {
  chainId: TChainId;
  txnData: TxnDataForChainId<TChainId> | undefined;
  paramsReq?: TradeBuildTxnRequest;
  signer: SignerForChainId<TChainId>;
  service?: AvailableDZapServices;
};

/**
 * Parameters for waiting for transaction receipt
 */
export type WaitForReceiptParams = {
  txHash: HexString;
  chainId: number;
  additionalData?: unknown; // Chain-specific data (e.g., signedTx, blockhash for Solana)
};

/**
 * Transaction receipt result
 */
export type TransactionReceipt = {
  status: TxnStatus;
  txHash?: HexString;
  error?: unknown;
};

/**
 * Client for talking to a chain (EVM, Solana, Sui, Bitcoin, etc.).
 * Provides unified interface for balance fetching and transaction operations across different blockchain ecosystems.
 */
export type IChainClient = {
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
  sendTransaction(params: SendTransactionParams): Promise<DZapTransactionResponse>;

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
};
