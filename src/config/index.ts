import { AppEnv } from 'src/enums';
import { Abi } from 'viem';

let APP_ENV;
let BASE_API_URL;
let ZAP_API_URL;

if (typeof process !== 'undefined' && process.env) {
  APP_ENV = process.env.REACT_APP_ENV || process.env.NEXT_PUBLIC_APP_ENV;
  BASE_API_URL = process.env.REACT_APP_BASE_API_URL || process.env.NEXT_PUBLIC_BASE_API_URL;
  ZAP_API_URL = process.env.REACT_APP_ZAP_API_URL || process.env.NEXT_PUBLIC_ZAP_API_URL;
}

const baseUrl = BASE_API_URL || 'https://api.dzap.io/';

const zapBaseUrl = ZAP_API_URL || 'https://zap.dzap.io/v1';

export const appEnv = APP_ENV || AppEnv.development;
export const versionPostfix = 'v1/';
export const getBaseUrl = (): string => {
  return `${baseUrl}${versionPostfix}`;
};

export const getBaseZapUrl = (): string => {
  return zapBaseUrl;
};

export type DeFiContract = {
  [key: string]: {
    abi: Abi;
    [key: number]: string;
  };
};

export const batchSwapIntegrators: {
  [key: string]: {
    contract: string;
  };
} = {
  dZap: {
    contract: '0x12480616436DD6D555f88B8d94bB5156E28825B1',
  },
};
