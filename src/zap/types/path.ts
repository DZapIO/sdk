import { HexString, ProviderDetails } from 'src/types';
import { zapPathAction } from '../constants/path';

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
};

export type ZapFee = {
  amount: string;
  amountUSD: string;
  asset: ZapPathAsset;
  included: boolean;
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
