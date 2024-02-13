export type HexString = `0x${string}`;

type SwapData = {
  sourceId?: string;
  srcToken: string;
  dstToken: string;
  amount: string;
  slippage: number;
  gasPrice?: number;
};

export type SwapParamRequest = {
  chainId: number;
  integratorId: string;
  sender: string;
  refundee: string;
  recipient: string;
  data: Array<SwapData>;
};

type SwapRequest = {
  amount: string;
  srcAmount?: string;
  globalAmount: string;
  account: string;
  fromTokenAddress: string;
  toTokenAddress: string;
  slippage: number;
};

export type QuoteRateRequest = {
  request: SwapRequest[];
  chainId: number;
  integrator: string;
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
