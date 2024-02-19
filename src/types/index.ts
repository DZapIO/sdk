export type HexString = `0x${string}`;

export const CHAINS_IDS = {
  ethereum: 1,
  polygon: 137,
  bsc: 56,
  dai: 100,
  fantom: 250,
  avalanche: 43114,
  arbitrum: 42161,
  optimism: 10,
  zkSync: 324,
  base: 8453,
  scroll: 534352,
} as const;

export type ChainIds = (typeof CHAINS_IDS)[keyof typeof CHAINS_IDS];

export type SwapData = {
  sourceId: string;
  srcToken: string;
  destToken: string;
  amount: string;
  slippage: number;
  gasPrice?: number;
  srcDecimals: number;
  destDecimals: number;
};

export type SwapParamsRequest = {
  chainId: ChainIds;
  integratorId: string;
  sender: string;
  refundee: string;
  recipient: string;
  withOutRevert?: boolean; // default true
  includeSwapCallData?: boolean; // default false
  includeTxData?: boolean; // default true
  data: Array<SwapData>;
};

export type SwapQuoteData = {
  amount: string;
  account: string;
  srcToken: string;
  srcDecimals: number;
  destToken: string;
  destDecimals: number;
  slippage: number;
};

export type SwapQuoteRequest = {
  chainId: ChainIds;
  integratorId: string;
  data: Array<SwapQuoteData>;
  allowedSources?: string[];
  notAllowedSources?: string[];
};

export type GetSwapParamsResponse = {
  value: string;
  ercSwapDetails: {
    executor: string;
    desc: {
      srcToken: string;
      dstToken: string;
      srcReceiver: string;
      dstReceiver: string;
      amount: string;
      minReturnAmount: string;
      flags: number;
      permit: string;
    };
    routeData: string;
    permit: string;
    minReturnAmount: number;
  }[];
};

export type SwapQuoteResponse = {
  [key: string]: {
    recommendedSourceByAmount: string;
    recommendedSourceByGas: string;
    quoteRates: {
      [key: string]: {
        data: {
          srcToken: string;
          srcAmount: string;
          destToken: string;
          destAmount: string;
          estimatedGas: string;
        };
      };
    };
  };
};

export {};
