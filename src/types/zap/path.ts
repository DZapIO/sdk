import { ZapFee, ZapUnderlyingToken } from '.';
import { HexString, ProviderDetails } from '..';
import { zapPathAction } from '../../constants';

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
