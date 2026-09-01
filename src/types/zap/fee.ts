import { zapFeeType } from '../../zap/constants/fee';
import { ZapAsset } from './path';

export type ZapFeeType = (typeof zapFeeType)[keyof typeof zapFeeType];

export type ZapFee = ZapAsset & {
  /** true when the amount is already deducted from the route's output, false when it is funded on top of it */
  included: boolean;
  /** true when the amount comes back to the payer later, e.g. account rent released on close */
  refundable: boolean;
  type: ZapFeeType;
};
