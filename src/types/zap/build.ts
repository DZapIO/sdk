import type { HexString } from '..';
import type { ZapPath } from './path';
import type { ZapStep } from './step';

export type ZapRouteRequestPositionDetails = {
  nftId: string;
};

export type ZapRouteRequestPoolDetails = {
  lowerTick: number;
  upperTick: number;
  metadata?: unknown;
};

export type ZapIntegratorConfig = {
  id: string;
  feeBps: number;
  wallet: string;
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
  srcToken: string;
  srcChainId: number;
  destToken: string;
  destChainId: number;
  recipient: string;
  refundee: string;
  slippage: number;
  account: string;
  integrator?: ZapIntegratorConfig;
  permitData?: string;
  amount?: string;
  estimateGas?: boolean;
  positionDetails?: ZapRouteRequestPositionDetails;
  poolDetails?: ZapRouteRequestPoolDetails;
  allowedBridges?: string[];
  allowedDexes?: string[];
};
