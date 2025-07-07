import { DZapAbis, OtherAbis, QuoteFilters, Services, STATUS_RESPONSE } from 'src/constants';
import { AppEnv, PermitSelector, StatusCodes, TxnStatus } from 'src/enums';
import { PsbtInput, PsbtOutput } from './btc';

export type HexString = `0x${string}`;

export type ChainData = {
  [key in number]: Chain;
};

export type NativeTokenInfo = {
  contract: string;
  symbol: string;
  decimals: number;
  name: string;
  balance: string;
  price?: string;
};

export const contractErrorActions = {
  TRY_ANOTHER_ROUTE: 'TRY_ANOTHER_ROUTE',
  INCREASE_SLIPPAGE: 'INCREASE_SLIPPAGE',
  INCREASE_ALLOWANCE: 'INCREASE_ALLOWANCE',
} as const;

export type ContractErrorResponse = {
  status: string;
  txId: string;
  code: number;
  message: string;
  error: unknown;
  action: keyof typeof contractErrorActions;
  details?: unknown;
};
export type CalculatePointsRequest = {
  srcTokens: { amount: string; address: string; decimals: number }[];
  destTokens: { amount: string; address: string; decimals: number }[];
  chainId: number;
  account: string;
  txType: 'swap' | 'bridge';
};

export type Chain = {
  coinKey: string;
  chainId: number;
  chainType: string;
  name: string;
  coin: string;
  dcaContract: string;
  swapBridgeContract: string;
  logo: string;
  tokenlistUrl?: string;
  multicallAddress: string;
  blockExplorerUrl: string;
  nativeToken: NativeTokenInfo;
  rpcProviders: ApiRpcResponse[];
  pricingAvailable: boolean;
  balanceAvailable: boolean;
  supportedAs: {
    source: boolean;
    destination: boolean;
  };
  contracts?: Partial<{
    router: string;
    dca: string;
    zap: string;
  }>;
  coingecko?: {
    chainKey: string;
    nativeTokenKey: string;
  };
  defiLlama?: {
    chainKey: string;
    nativeTokenKey: string;
  };
  disableMultiTxn: boolean;
  isEnabled: boolean;
  mainnet: boolean;
};

export type ApiRpcResponse = {
  url: string;
  keyRequired: boolean;
  keyType?: 'ALCHEMY_KEY' | 'BLASTAPI_KEY';
};

export type PermitSelectorData = { address: HexString; permitSelector: PermitSelector; permitAllowance: bigint };

export type ProviderDetails = {
  id: string;
  name: string;
  icon: string;
};

export type FeeDetails = {
  address: string;
  decimals: number;
  chainId: number;
  symbol: string;
  logo?: string;
  amount: string;
  amountUSD: string;
  included: boolean;
};

export type Fee = {
  gasFee: FeeDetails[];
  protocolFee: FeeDetails[];
  providerFee: FeeDetails[];
};

export type QuoteFilter = keyof typeof QuoteFilters;

export type QuotesRequest = {
  integratorId: string;
  fromChain: number;
  data: QuotesRequestData[];
  disableEstimation?: boolean;
  account?: string;
  allowedSources?: string[];
  filter?: QuoteFilter;
};

export type QuotesRequestData = {
  amount: string;
  srcToken: string;
  srcDecimals: number;
  destToken: string;
  destDecimals: number;
  toChain: number;
  slippage: number;
  selectedSource?: string;
};

export type Step = {
  type: string;
  exchange: {
    logo: string;
    name: string;
  };
};

export type Path = {
  type: string;
  exchange: ProviderDetails;
  srcToken: Token;
  srcAmount: string;
  srcAmountUSD: string;
  destToken: Token;
  destAmount: string;
  destAmountUSD: string;
  fee: Fee;
};

export type Tag = { title: string; link?: string; message?: string };

export type Quote = {
  bridgeDetails?: ProviderDetails;
  providerDetails: ProviderDetails;
  srcAmount: string;
  srcAmountUSD: string;
  destAmount: string;
  destAmountUSD: string;
  minDestAmount: string;
  swapPerUnit: string;
  srcToken: Token;
  destToken: Token;
  fee: Fee;
  priceImpactPercent: string;
  duration: string;
  steps: Step[];
  path: Path[];
  tags?: Tag[];
  additionalInfo?: AdditionalInfo;
};

export type QuotesByProviderId = {
  [providerAndBridge: string]: Quote;
};

export type QuotesResponse = {
  [pair: string]: {
    status?: string;
    message?: string;
    recommendedSource: string;
    fastestSource: string;
    questSource?: string;
    quoteRates?: QuotesByProviderId;
    tokensWithoutPrice: Record<number, string[]>;
  };
};

export type BridgeSource = {
  provider: string;
  bridge: string;
};

export type AdditionalInfo = {
  [key: string]: unknown;
};

export type Token = {
  address: HexString;
  decimals: number;
  chainId: number;
  logo: string;
  symbol: string;
  price?: string;
};

export type TokenInfo = NativeTokenInfo & {
  chainId: number;
  balanceInUsd?: number | null;
  isDisabledOnSwapBridge?: {
    source: boolean;
    destination: boolean;
  };
  isDisabledOnZap?: {
    source: boolean;
    destination: boolean;
  };
};

export type TokenResponse = {
  [key: string]: TokenInfo;
};

// Bridge Params

export type BuildTxRequest = {
  sender: HexString;
  refundee: HexString;
  integratorId: string;
  fromChain: number;
  disableEstimation?: boolean;
  data: BuildTxRequestData[];
  publicKey?: string;
};

export type BuildTxRequestData = {
  amount: string;
  srcToken: string;
  srcDecimals: number;
  destToken: string;
  destDecimals: number;
  toChain: number;
  selectedRoute: string;
  recipient: string;
  slippage: number;
  additionalInfo?: AdditionalInfo;
  permitData?: string;
};

export type ExecuteTxnData = {
  data: HexString;
  to: HexString;
  from: HexString;
  chainId: number;
  value: string;
  gasLimit: string;
};

export type BuildTxResponse = ExecuteTxnData & {
  additionalInfo?: AdditionalInfo;
  //dev: only used for btc tx.
  btcTxData?: {
    inputs: PsbtInput[];
    outputs: PsbtOutput[];
    feeRate: number;
  };
  svmTxData?: {
    blockhash: string;
    lastValidBlockHeight: number;
  };
  updatedQuotes: Record<string, string>;
};

export type AvailableDZapServices = (typeof Services)[keyof typeof Services];

export type DZapAvailableAbis = (typeof DZapAbis)[keyof typeof DZapAbis];

export type OtherAvailableAbis = (typeof OtherAbis)[keyof typeof OtherAbis];

export type AppEnvType = `${AppEnv}`;

export type DZapTransactionResponse = {
  status: TxnStatus;
  errorMsg?: string;
  code: StatusCodes | number;
  action?: keyof typeof contractErrorActions;
  txnHash?: HexString;
  error?: unknown;
  additionalInfo?: Record<string, unknown>;
  updatedQuotes?: Record<string, string>;
};

export type SwapInfo = {
  dex: string; //dex if router address not name of provider
  fromToken: string;
  fromAmount: bigint;
  toToken: string;
  returnToAmount: bigint;
};

export type StatusResponseData = {
  srcChainId: number;
  srcToken: string;
  srcAmount: string;
  srcAmountUSD: string;
  srcTxHash: string;
  destChainId: number;
  destToken: string;
  destAmount: string;
  destAmountUSD: string;
  destTxHash: string;
  account: string;
  recipient: string;
  outputToken?: string;
  refundTxHash?: string;
  provider: string;
  allowUserTxOnDestChain: boolean;
  status: keyof typeof STATUS_RESPONSE;
};

export type StatusResponse = {
  [pair: string]: StatusResponseData;
};
