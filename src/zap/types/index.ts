import { HexString } from 'src/types';
import { ZapPath, ZapPathAsset } from './path';
import { ZapStep } from './step';

export type ZapRouteResponse = {
  steps: ZapStep[];
  path: ZapPath[];
};

export type ZapRouteRequest = {
  srcToken: HexString;
  srcChainId: number;
  destToken: HexString;
  destChainId: number;
  amount?: string;
  recipient: HexString;
  refundee: HexString;
  slippage: number;
  account: HexString;
  estimateGas?: boolean;
  positionDetails?: ZapRouteRequestPositionDetails;
  poolDetails?: ZapRouteRequestPoolDetails;
};

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
