import { ZapUnderlyingToken } from '.';
import { HexString, ProviderDetails } from '../..';
import { zapPathAction } from '../../zap/constants/path';
import { ZapFee } from './fee';
import { ZapRefund } from './refund';

export type ZapPathAction = keyof typeof zapPathAction;

export type ZapPathAsset = {
  chainId: number;
  address: HexString;
  symbol: string;
  logo: string;
  decimals: number;
  price: string;
  type: string;
  name: string;
  provider?: ProviderDetails;
  underlyingTokens?: ZapUnderlyingToken[];
};

/** One asset with its amount and USD value at quote time. */
export type ZapAsset = {
  asset: ZapPathAsset;
  amount: string;
  amountUSD: string;
};

/** An asset the user receives, with the floor its amount is guaranteed not to fall below. */
export type ZapOutput = ZapAsset & {
  minAmount: string;
};

export type ZapPath = {
  action: ZapPathAction;
  protocol: ProviderDetails;
  fee: ZapFee[];
  refund: ZapRefund[];
  estimatedDuration: number;
  input: ZapAsset[];
  output: ZapOutput[];
};
