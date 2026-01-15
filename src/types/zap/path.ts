import type { ZAP_PATH_ACTIONS } from '../../constants';
import type { HexString, ProviderDetails } from '..';
import type { ZapFee, ZapUnderlyingToken } from '.';

export type ZapPathAction = keyof typeof ZAP_PATH_ACTIONS;

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

export type ZapPath = {
  action: ZapPathAction;
  protocol: ProviderDetails;
  fee: ZapFee[];
  estimatedDuration: number;
  input: {
    asset: ZapPathAsset;
    amount: string;
    amountUSD: string;
  }[];
  output: {
    asset: ZapPathAsset;
    amount: string;
    amountUSD: string;
    dust?: boolean;
  }[];
};
