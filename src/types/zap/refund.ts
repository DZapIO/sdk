import { zapRefundType } from '../../zap/constants/fee';
import { ZapOutputAmount } from './path';

export type ZapRefundType = (typeof zapRefundType)[keyof typeof zapRefundType];

/** An amount returned to the user on top of the requested output — positive slippage, or rent given back. */
export type ZapRefund = ZapOutputAmount & {
  type: ZapRefundType;
};
