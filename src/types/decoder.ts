import { TransactionReceipt } from 'viem';
import { AvailableDZapServices, Chain, SwapInfo } from '.';

export type TokenAmount = { token: string; amount: bigint };

// what an account sent and received in a transaction, as read from the chain
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

export type DecodeTxnDataParams = {
  service: AvailableDZapServices;
  chain: Chain;
  // evm reads the swap info from the receipt's events, fetched by txHash when no receipt is given
  receipt?: TransactionReceipt;
  txHash?: string;
  // other chains have no event to read it from, so the swap info (e.g. the quote) is patched with the actual amounts
  eventSwapInfo?: SwapInfo | SwapInfo[];
  rpcUrls?: string[];
};

// whether the swap amounts were taken from the transaction itself, and why not when they were not
export type SwapAmountsPatchResult = {
  swapInfo: SwapInfo | SwapInfo[];
  isAmountPatched: boolean;
  amountPatchError?: string;
};

export type DecodeTxnDataResponse = SwapAmountsPatchResult & {
  swapFailPairs: string[];
};
