import { ZapUnderlyingToken } from '.';
import { HexString } from '..';

export type ZapPoolDetailsRequest = {
  address: HexString;
  chainId: number;
  provider: string;
};

export type ZapPoolsRequest = {
  chainId: number;
  provider: string;
  limit?: number;
  offset?: number;
};

export type ZapPoolsResponse = {
  pools: ZapPool[];
  pages: number;
  limit: number;
  offset: number;
};

export type ZapPool = {
  address: string;
  chainId: number;
  name: string;
  provider: string;
  underlyingAssets: ZapUnderlyingToken[];
  tvl: number | string;
  apr: number;
  apy?: number;
  metadata?: unknown;
  symbol: string;
  decimals: number;
  metricsRefresh?: {
    lastRefreshedAt: number;
    nextRefreshAt: number;
  };
};

export type ZapPoolDetails = {
  address: string;
  chainId: number;
  name: string;
  symbol: string;
  decimals: number;
  floorLevel?: number;
  logo?: string;
  platformId?: string;
  underlyingTokens?: ZapUnderlyingToken[];
  metadata?: unknown;
  apr?: number;
  apy?: number;
  slot0?: {
    sqrtPriceX96: string;
    tick: number;
    tickSpacing: number;
  };
};
