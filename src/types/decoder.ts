import { TransactionReceipt } from 'viem';
import { AvailableDZapServices, Chain, SwapInfo } from '.';
import { chainTypes } from '../constants/chains';

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

export type EvmChain = Chain & { chainType: typeof chainTypes.evm };
export type SvmChain = Chain & { chainType: typeof chainTypes.svm };
export type SuivmChain = Chain & { chainType: typeof chainTypes.suivm };

type BaseDecodeTxnDataParams = {
  service: AvailableDZapServices;
  rpcUrls?: string[];
};

// evm reads the swap info from the receipt's events, fetched by txHash when no receipt is given
export type DecodeEvmTxnDataParams = BaseDecodeTxnDataParams & { chain: EvmChain } & {
  eventSwapInfo?: SwapInfo | SwapInfo[];
} & ({ receipt: TransactionReceipt; txHash?: string } | { receipt?: undefined; txHash: string });

// solana and sui have no dZap event to read it from, so the swap info (e.g. the quote) comes from the caller
// and is patched with the amounts the transaction actually moved
type DecodeGivenSwapInfoTxnDataParams<TChain extends Chain> = BaseDecodeTxnDataParams & {
  chain: TChain;
  txHash: string;
  eventSwapInfo: SwapInfo | SwapInfo[];
  receipt?: undefined;
};

export type DecodeSvmTxnDataParams = DecodeGivenSwapInfoTxnDataParams<SvmChain>;
export type DecodeSuivmTxnDataParams = DecodeGivenSwapInfoTxnDataParams<SuivmChain>;

export type DecodeTxnDataParams = DecodeEvmTxnDataParams | DecodeSvmTxnDataParams | DecodeSuivmTxnDataParams;

// the chain is looked up by chainId, so only the receipt-or-txHash rule can be held to at compile time here
export type DecodeTxnDataClientParams = {
  service: AvailableDZapServices;
  chainId: number;
  rpcUrls?: string[];
  eventSwapInfo?: SwapInfo | SwapInfo[];
} & ({ data: TransactionReceipt; txHash?: string } | { data?: undefined; txHash: string });

// whether the swap amounts were taken from the transaction itself, and why not when they were not
export type SwapAmountsPatchResult = {
  swapInfo: SwapInfo | SwapInfo[];
  isAmountPatched: boolean;
  amountPatchError?: string;
};

export type DecodeTxnDataResponse = SwapAmountsPatchResult & {
  swapFailPairs: string[];
};
