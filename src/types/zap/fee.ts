import { ZapPathAsset } from './path';

export type ZapFee = {
  amount: string;
  amountUSD: string;
  asset: ZapPathAsset;
  included: boolean;
  refundable: boolean;
};
