import { HexString, ProviderDetails } from '../';

export type ZapApiResponse<T> = {
  status: 'success';
  data: T;
};

export type ZapProviderDetails = ProviderDetails & {
  tags?: string[];
  description?: string;
  websiteUrl?: string;
  supportedActions?: string[];
  supportedChainIds?: number[];
};

export type ZapProviders = Record<string, ZapProviderDetails>;

export type ZapChainConfig = {
  name: string;
  supportedProviders: string[];
  contracts?: {
    zap?: string;
  };
};

export type ZapChains = { [key: string]: ZapChainConfig };

export type ZapUnderlyingToken = {
  chainId: number;
  address: HexString;
  name?: string;
  symbol: string;
  decimals: number;
  logo?: string | null;
};

export type ZapUnderlyingTokenWithAmount = ZapUnderlyingToken & {
  amount: string;
  amountUSD: string;
  price?: string;
};

export * from './build';
export * from './bundle';
export * from './path';
export * from './pool';
export * from './position';
export * from './quote';
export * from './status';
export * from './step';
export * from './fee';
