import { HexString, ProviderDetails } from '../';

export type ZapProviders = Record<string, ProviderDetails>;

export type ZapChains = { [key: string]: { name: string; supportedProviders: string[] } };

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
};

export * from './build';
export * from './bundle';
export * from './path';
export * from './refund';
export * from './pool';
export * from './position';
export * from './quote';
export * from './status';
export * from './step';
export * from './fee';
