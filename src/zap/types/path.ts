import { HexString } from 'src/types';
import { zapPathAction } from '../constants/path';

export type ZapPathAction = keyof typeof zapPathAction;

export type ZapPathAsset = {
  chainId: number;
  address: HexString;
  symbol: string;
  logo: string;
  decimal: number;
  price: string;
  type: string;
};

export type ZapPath = {
  action: ZapPathAction;
  protocol: string;
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
