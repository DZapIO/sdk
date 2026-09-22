import { Prettify, TransactionReceipt } from 'viem';
import { AvailableDZapServices, SwapInfo } from '.';

export type TokenAmount = { token: string; amount: bigint };

export type TxTokenAmounts = {
  sent: ReadonlyArray<TokenAmount>;
  received?: ReadonlyArray<TokenAmount>;
};

export type DecodeTransactionParameters = {
  txHash: string;
  chainId: number;
  rpcUrls?: string[];
};

export type DecodeTransactionReturnType = Promise<TxTokenAmounts | undefined>;

type BaseDecodeTxnDataParams = {
  service: AvailableDZapServices;
  rpcUrls?: string[];
};

export type DecodeTxnDataParamsByTxHash = BaseDecodeTxnDataParams & {
  txHash: string;
};

export type DecodeTxnDataParamsByReceipt = BaseDecodeTxnDataParams & {
  receipt: TransactionReceipt;
};

export type DecodeTxnDataParamsWithSwapInfo = BaseDecodeTxnDataParams & {
  eventSwapInfo: SwapInfo | SwapInfo[];
  txHash: string;
};

export type DecodeTxnDataParams = DecodeTxnDataParamsByTxHash | DecodeTxnDataParamsByReceipt | DecodeTxnDataParamsWithSwapInfo;

// Omit is not distributive: over a union it keeps only the keys the arms share, so it would collapse
// the three ways of decoding into one. Omitting arm by arm keeps them apart.
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

// the client looks the chain up by id; service and rpcUrls come from BaseDecodeTxnDataParams
type DecodeTxnDataClientOptions = {
  chainId: number;
};

export type DecodeTxnDataClientParams = Prettify<DecodeTxnDataParams & DecodeTxnDataClientOptions>;

// for consumers that have already bound the service
export type DecodeTxnDataClientParamsWithoutService = Prettify<DistributiveOmit<DecodeTxnDataClientParams, 'service'>>;

export type SwapAmountsPatchResult = {
  swapInfo: SwapInfo | SwapInfo[];
  isAmountPatched: boolean;
  amountPatchError?: string;
};

export type DecodeTxnDataResponse = SwapAmountsPatchResult & {
  swapFailPairs: string[];
};
