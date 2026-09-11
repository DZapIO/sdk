import { HexString } from '..';
import { ZapIntegratorConfig, ZapRouteRequestPoolDetails, ZapRouteRequestPositionDetails } from './build';
import { ZapPathAction } from './path';
import { ZapPreExecutionStepData } from './step';

export type ZapBundleSrcToken = {
  address: string;
  amount?: string;
};

export type ZapBundleAction = {
  action: ZapPathAction;
  srcToken: ZapBundleSrcToken | ZapBundleSrcToken[];
  srcChainId: number;
  destToken?: string;
  destChainId?: number;
  positionDetails?: ZapRouteRequestPositionDetails;
  poolDetails?: ZapRouteRequestPoolDetails;
  protocol?: string;
  permitData?: HexString;
  batchPermitData?: HexString;
};

export type ZapBundleRequest = {
  actions: ZapBundleAction[];
  account: string;
  recipient: string;
  refundee: string;
  slippage: number;
  quotesOnly?: boolean;
  estimateGas?: boolean;
  integrator?: ZapIntegratorConfig;
  allowedDexes?: string[];
  allowedBridges?: string[];
  preExecutionStepsData?: ZapPreExecutionStepData[];
};
