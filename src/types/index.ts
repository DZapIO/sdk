export type SwapParamRequest = {
  amount: string;
  globalAmount: string;
  fromTokenAddress: string;
  toTokenAddress: string;
  account: string;
  exchange: string;
  slippage: number;
};

export type QuoteRateRequest = {
  amount: string;
  globalAmount: string;
  fromTokenAddress: string;
  toTokenAddress: string;
  account: string;
  slippage: number;
};

export interface GetSwapParamsResponse {
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
}
