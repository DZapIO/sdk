import type { HexString } from '..';
import type { ZapUnderlyingToken } from '.';

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
  tvl: string;
  apr: number;
  metadata?: unknown;
  symbol: string;
  decimals: number;
};

export type ZapPoolDetails = {
  address: string;
  slot0: {
    sqrtPriceX96: string;
    tick: number;
    tickSpacing: number;
  };
};
