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

type ChainIdToSignerMap = {
  7565164: SolanaSigner;
  19219: SuiWallet;
  1000: BitcoinSigner;
  1001: BitcoinSigner;
  728126428: Signer | WalletClient;
  607: Signer | WalletClient;
  116201519: Signer | WalletClient;
};

type SignerForChainId<TChainId extends number> = TChainId extends keyof ChainIdToSignerMap ? ChainIdToSignerMap[TChainId] : DZapSigner;

type ChainIdToTxnDataMap = {
  7565164: TradeBuildTxnResponse;
  19219: TradeBuildTxnResponse;
  1000: TradeBuildTxnResponse | ZapBuildTxnResponse | ZapBuildTxnPayload;
  1001: TradeBuildTxnResponse | ZapBuildTxnResponse | ZapBuildTxnPayload;
  728126428: EvmTxData | GaslessTradeBuildTxnResponse | TradeBuildTxnResponse;
  607: EvmTxData | GaslessTradeBuildTxnResponse | TradeBuildTxnResponse;
  116201519: EvmTxData | GaslessTradeBuildTxnResponse | TradeBuildTxnResponse;
};

type TxnDataForChainId<TChainId extends number> = TChainId extends keyof ChainIdToTxnDataMap
  ? ChainIdToTxnDataMap[TChainId]
  : EvmTxData | GaslessTradeBuildTxnResponse | TradeBuildTxnResponse | ZapBuildTxnResponse | ZapBuildTxnPayload;

export type SendTransactionParams<TChainId extends number = number> = {
  chainId: TChainId;
  txnData: TxnDataForChainId<TChainId> | undefined;
  paramsReq?: TradeBuildTxnRequest;
  signer: SignerForChainId<TChainId>;
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
