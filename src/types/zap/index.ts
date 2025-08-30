import { HexString, ProviderDetails } from 'src/types';
import { ZapPathAsset } from './path';

export type ZapProviders = Record<string, ProviderDetails>;

export type ZapChains = { [key: string]: { name: string; supportedProviders: string[] } };

export type ZapFee = {
  amount: string;
  amountUSD: string;
  asset: ZapPathAsset;
  included: boolean;
};

export type ZapUnderlyingToken = {
  chainId: number;
  address: HexString;
  name?: string;
  symbol: string;
  decimals: number;
  logo?: string | null;
};

export * from './build';
export * from './path';
export * from './pool';
export * from './position';
export * from './quote';
export * from './status';
export * from './step';
