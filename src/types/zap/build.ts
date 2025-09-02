import { HexString } from '..';
import { ZapPath } from './path';
import { ZapStep } from './step';

export type ZapRouteRequestPositionDetails = {
  nftId: string;
};

export type ZapRouteRequestPoolDetails = {
  lowerTick: number;
  upperTick: number;
  metadata?: unknown;
};

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
