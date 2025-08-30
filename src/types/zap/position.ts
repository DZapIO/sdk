import { ZapUnderlyingToken } from '.';
import { HexString } from '..';

export type ZapPositionsRequest = {
  account: HexString;
  chainId: number;
  provider: string;
};

export type ZapPosition = {
  underlyingAssets: ZapUnderlyingToken &
    {
      amount: string;
      amountUSD: string;
    }[];
  address: string; // pool address
  apr: number;
  name: string;
  chainId: number;
  provider: string;
  amount: string;
  amountUSD: string;
  nftDetails?: {
    id: string;
    manager: HexString;
  };
  metadata?: unknown;
  decimals: number;
};

export type ZapPositionsResponse = {
  positions: ZapPosition[];
  count: number;
};
