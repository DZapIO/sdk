import { HexString, ProviderDetails } from 'src/types';
import { ZapPath, ZapPathAsset } from './path';
import { ZapStep } from './step';

export type ZapBuildTxnResponse = {
  amountOut: string;
  approvalData: {
    callTo: HexString;
    approveTo: HexString;
    amount: string;
  } | null;
  steps: ZapStep[];
  path: ZapPath[];
};

export type ZapQuoteResponse = Omit<ZapBuildTxnResponse, 'steps'>;

export type ZapBuildTxnRequest = {
  srcToken: HexString;
  srcChainId: number;
  destToken: HexString;
  destChainId: number;
  recipient: HexString;
  refundee: HexString;
  slippage: number;
  account: HexString;
  permitData?: HexString;
  amount?: string;
  estimateGas?: boolean;
  positionDetails?: ZapRouteRequestPositionDetails;
  poolDetails?: ZapRouteRequestPoolDetails;
  allowedBridges?: string[];
  allowedDexes?: string[];
};

export type ZapQuoteRequest = ZapBuildTxnRequest;

export type ZapRouteRequestPositionDetails = {
  nftId: string;
};

export type ZapRouteRequestPoolDetails = {
  lowerTick: number;
  upperTick: number;
  metadata?: unknown;
};

export type ZapStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export type ZapStatusAsset = {
  asset: ZapPathAsset;
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
};

export type ZapStatusRequest = {
  chainId: number;
  txnHash: string;
};

export type ZapPositionsRequest = {
  account: HexString;
  chainId: number;
  provider: string;
};

export type ZapPoolsRequest = {
  chainId: number;
  provider: string;
  limit?: number;
  offset?: number;
};

export type ZapPoolDetailsRequest = {
  address: HexString;
  chainId: number;
  provider: string;
};

export type ZapRouteRequest = ZapBuildTxnRequest;

export type ZapTokenDetailsRequest = {
  address: HexString;
  chainId: number;
};

export type ZappingProviders = Record<string, ProviderDetails>;

export type ZappingChains = { [key: string]: { name: string; supportedProviders: string[] } };

export type ZappingFormDataPoolDetails = {
  lowerTick: number;
  upperTick: number;
};

export type ZappingPools = {
  pools: ZappingPoolTokenData[];
  pages: number;
  limit: number;
  offset: number;
};

export type ZappingUnderlyingAsset = {
  address: string;
  chainId: number;
  decimals: number;
  logo: string;
  symbol: string;
  price: string;
};

export type ZappingPoolTokenData = {
  address: string;
  chainId: number;
  name: string;
  provider: string;
  underlyingAssets: ZappingUnderlyingAsset[];
  tvl: string;
  apr: number;
  metadata?: unknown;
  symbol: string;
  decimals: number;
};

export type ZappingPoolDetails = {
  address: string;
  slot0: {
    sqrtPriceX96: string;
    tick: number;
    tickSpacing: number;
  };
};

export type ZappingPoolStateDetails = ZappingPoolDetails & {
  initialData: {
    lowerPrice: number;
    upperPrice: number;
    lowerTick: number;
    upperTick: number;
    lowerPercent: number;
    upperPercent: number;
  };
};

export type ZappingPositions = {
  positions: ZappingPositionTokenData[];
  count: number;
};

export type ZappingPositionTokenData = {
  underlyingAssets: {
    address: string;
    logo: string;
    decimals: number;
    symbol: string;
    price: string;
    chainId: number;
    amount: string;
    amountUSD: number;
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

export * from './path';
export * from './step';
