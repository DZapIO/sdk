import { ProviderDetails } from '..';
import { ZapLimitOrderDetails } from './limitOrder';
import { ZapAsset } from './path';

export type ZapStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export type ZapStatusStep = {
  chainId: number;
  hash?: string;
  status: ZapStatus;
  action: string;
  protocol: ProviderDetails;
  input: ZapAsset[];
  output: ZapAsset[];
};

export type ZapStatusResponse = {
  status: ZapStatus;
  account: string;
  recipient: string;
  input: ZapAsset[];
  output: ZapAsset[];
  steps: ZapStatusStep[];
  timestamp: number;
  completedAt: number;
  limitOrderDetails?: ZapLimitOrderDetails;
};

export type ZapStatusRequest = {
  chainId: number;
  txnHash: string;
};
