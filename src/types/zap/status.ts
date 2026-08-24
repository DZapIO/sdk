import { ProviderDetails } from '..';
import { ZapLimitOrderDetails } from './limitOrder';
import { ZapPathAsset } from './path';

export type ZapStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

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
  account: string;
  recipient: string;
  input: ZapStatusAsset[];
  output: ZapStatusAsset[];
  steps: ZapStatusStep[];
  timestamp: number;
  completedAt: number;
  limitOrderDetails?: ZapLimitOrderDetails;
};

export type ZapStatusRequest = {
  chainId: number;
  txnHash: string;
};
