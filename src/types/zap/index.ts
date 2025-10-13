import { HexString, ProviderDetails } from 'src/types';
import { ZapPathAsset } from './path';
import { ZapStatus, ZapStatusAsset } from './status';

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

export type ZapUnderlyingTokenWithAmount = ZapUnderlyingToken & {
  amount: string;
  amountUSD: string;
};

export type ZapStatusStep = {
  chainId: number;
  hash?: string;
  status: ZapStatus;
  action: string;
  protocol: ProviderDetails;
  input: ZapStatusAsset[];
  output: ZapStatusAsset[];
};

export type ZapStatusResponse = {
  status: ZapStatus;
  steps: ZapStatusStep[];
  recipient: string;
  timestamp: number;
  completedAt: number;
};

export type ZapStatusRequest = {
  chainId: number;
  txnHash: string;
};

export * from './build';
export * from './path';
export * from './pool';
export * from './position';
export * from './quote';
export * from './status';
export * from './step';
