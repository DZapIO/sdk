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

type DecodeTxnDataClientOptions = {
  service: AvailableDZapServices;
  chainId: number;
  rpcUrls?: string[];
};

export type DecodeTxnDataClientParams = Prettify<DecodeTxnDataParams & DecodeTxnDataClientOptions>;

export type SwapAmountsPatchResult = {
  swapInfo: SwapInfo | SwapInfo[];
  isAmountPatched: boolean;
  amountPatchError?: string;
};

export type DecodeTxnDataResponse = SwapAmountsPatchResult & {
  swapFailPairs: string[];
};
