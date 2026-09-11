import { HexString } from '..';
import { ZapPreExecutionStep, ZapPreExecutionStepData, ZapStep } from './step';
import { ZapFee } from './fee';
import { ZapOutput, ZapPath } from './path';
import { ZapRefund } from './refund';

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
  /** returned to the user on top of `output` — positive-slippage dust and any rent given back */
  refund: ZapRefund[];
  /** every fee the route charges, across all of its steps */
  fees: ZapFee[];
  output: ZapOutput[];
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
