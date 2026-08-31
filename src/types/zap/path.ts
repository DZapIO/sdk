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

/** An amount of one asset, with its USD value at quote time. */
export type ZapAssetAmount = {
  asset: ZapPathAsset;
  amount: string;
  amountUSD: string;
};

/** An asset amount the user receives, with the floor it is guaranteed not to fall below. */
export type ZapOutputAmount = ZapAssetAmount & {
  minAmount: string;
};

export type ZapPath = {
  action: ZapPathAction;
  protocol: ProviderDetails;
  fee: ZapFee[];
  refund: ZapRefund[];
  estimatedDuration: number;
  input: ZapAssetAmount[];
  output: ZapOutputAmount[];
};
