import { HexString, TradeBuildTxnRequest, TradeBuildTxnResponse, TxData, WaitForTxnResponse } from '../../types';
import { DZapSigner } from '../../types/signer';
import { ZapTxnDetails } from '../../types/zap/step';

export type SendTradeParams<S> = {
  chainId: number;
  signer: S;
  request: TradeBuildTxnRequest;
  txnData: TradeBuildTxnResponse;
  rpcUrls?: string[];
  batchTransaction?: boolean;
  multicallAddress?: HexString;
};

export type SendTxnParams<S> = {
  chainId: number;
  signer: S;
  txnData: TxData;
  /** the build's `txId`, for transactions the DZap API broadcasts */
  txId?: string;
  rpcUrls?: string[];
};

export type SendZapStepParams<S> = {
  chainId: number;
  signer: S;
  step: ZapTxnDetails;
  rpcUrls?: string[];
};

export type WaitForTxnParams = {
  chainId: number;
  txnHash: string;
  rpcUrls?: string[];
  timeoutMs?: number;
};

/**
 * Sends and tracks the transactions of one chain type. Every send resolves to the hash of what it sent,
 * or throws; a {@link DZapTxnError} says why in terms an integrator can act on.
 */
export type ChainAdapter<S extends DZapSigner = DZapSigner> = {
  /** whether the signer can sign transactions of this chain type */
  isSigner: (signer: DZapSigner) => signer is S;
  /** sends a trade the DZap API built */
  sendTrade: (params: SendTradeParams<S>) => Promise<{ txnHash: string }>;
  /** sends a prebuilt transaction */
  sendTransaction: (params: SendTxnParams<S>) => Promise<{ txnHash: string }>;
  /** sends the execute step of a zap */
  sendZapStep: (params: SendZapStepParams<S>) => Promise<{ txnHash: string }>;
  /** waits for a sent transaction to settle, never throws */
  waitForTransaction: (params: WaitForTxnParams) => Promise<WaitForTxnResponse>;
};
