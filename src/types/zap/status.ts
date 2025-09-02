import { ProviderDetails } from '..';
import { ZapPathAsset } from './path';

export type ZapStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

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
  steps: ZapStatusStep[];
};

export type ZapStatusRequest = {
  chainId: number;
  txnHash: string;
};
