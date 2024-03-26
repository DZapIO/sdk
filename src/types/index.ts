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
  rpcProvider: ApiRpcResponse;
};

export type ApiRpcResponse = {
  url: string;
  keyRequired: boolean;
  keyType?: 'ALCHEMY_KEY';
};

// Swap

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
  selectedSource?: string;
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

// Bridge

export type BridgeQuoteRequest = {
  amount: string;
  account?: string;
  srcToken: string;
  destToken: string;
  slippage: number;
  fromChain: ChainIds;
  toChain: ChainIds;
};

export type Step = {
  type: string;
  exchange: {
    logo: string;
    name: string;
  };
};

export type Fee = {
  token: {
    address: string;
    decimals: number;
    chainId: number;
    symbol: string;
    logo: string;
  };
  amount: string;
  amountUSD: string;
};

export type BridgeQuoteResponse = {
  [pair: string]: {
    recommendedSourceByAmount?: BridgeSource;
    quoteRates?: {
      [provider: string]: BridgeQuoteRate;
    };
  };
};

export type BridgeSource = {
  provider: string;
  bridge: string;
};

export type BridgeAdditionalInfo = {
  routePath?: string;
  bridgeInputAddress?: string;
};

export type BridgeQuoteRate = {
  [bridge: string]: {
    bridgeDetails: {
      name: string;
      logo: string;
    };
    srcToken: string;
    srcChainId: ChainIds;
    srcDecimals: number;
    srcAmount: string;
    destToken: string;
    destChainId: ChainIds;
    destDecimals: number;
    destAmount: string;
    gasFee: Fee;
    protocolFee: Fee;
    duration: string;
    steps: Step[];
    additionalInfo?: BridgeAdditionalInfo;
  };
};

// Bridge Params

export type BridgeParamsRequest = {
  amount: string;
  account: string;
  srcToken: string;
  destToken: string;
  slippage: number;
  fromChain: ChainIds;
  toChain: ChainIds;
  selectedRoute: BridgeSource;
  additionalInfo?: BridgeAdditionalInfo;
};

export type BridgeData = {
  bridge: string;
  from: string;
  to: string;
  receiver: string;
  minAmount: string;
  destinationChainId: number;
  hasSourceSwaps: boolean;
  hasDestinationCall: boolean;
};

export type GenericData = {
  callTo: string;
  approveTo: string;
  extraNative: string;
  permit: string;
  callData: string;
};

export type BridgeParamsResponse = {
  bridgeData: BridgeData[];
  genericData: GenericData[];
  value: string;
  gasLimit: string;
};
