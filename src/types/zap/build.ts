import { HexString } from '..';
import { ZapPath } from './path';
import { ZapPreExecutionStep, ZapPreExecutionStepData, ZapStep } from './step';

export type ZapErc721PositionDetails = {
  nftId: string;
};

export type ZapLimitOrderPositionDetails = {
  provider: string;
  limitPrice: string;
  expiry?: number;
};

export type ZapRouteRequestPositionDetails = ZapErc721PositionDetails | ZapLimitOrderPositionDetails;

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
  approvalData: {
    callTo: HexString;
    approveTo: HexString;
    amount: string;
  }[];
  dust: ZapPath['output'];
  output: ZapPath['output'];
  steps: ZapStep[];
  path: ZapPath[];
  preExecutionSteps?: ZapPreExecutionStep[];
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
  preExecutionStepsData?: ZapPreExecutionStepData[];
  amount?: string;
  estimateGas?: boolean;
  positionDetails?: ZapRouteRequestPositionDetails;
  poolDetails?: ZapRouteRequestPoolDetails;
  allowedBridges?: string[];
  allowedDexes?: string[];
};
