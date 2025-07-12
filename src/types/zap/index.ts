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

export type ZapTxnStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export type ZapTransactionAsset = {
  asset: ZapPathAsset;
  amount: string;
  amountUSD: string;
};

export type ZapTxnStatusStep = {
  chainId: number;
  hash?: string;
  status: ZapTxnStatus;
  action: string;
  protocol: ProviderDetails;
  input: ZapTransactionAsset[];
  output: ZapTransactionAsset[];
};

export type ZapTxnStatusResponse = {
  status: ZapTxnStatus;
  steps: ZapTxnStatusStep[];
};

export type ZapTxnStatusRequest = {
  chainId: string;
  txnHash: string;
};

export * from './path';
export * from './step';
