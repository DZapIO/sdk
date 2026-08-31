import { ProviderDetails } from '..';
import { ZapAssetAmount } from './path';

export type ZapStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export type ZapStatusAsset = ZapAssetAmount;

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
};

export type ZapStatusRequest = {
  chainId: number;
  txnHash: string;
};
