import { zapRefundType } from '../../zap/constants/fee';
import { ZapOutput } from './path';

export type ZapRefundType = (typeof zapRefundType)[keyof typeof zapRefundType];

/** An amount returned to the user on top of the requested output — positive slippage, or rent given back. */
export type ZapRefund = ZapOutput & {
  type: ZapRefundType;
};
