import { AppEnv } from 'src/enums';

let APP_ENV;
let BASE_API_URL;
let ZAP_API_URL;
let API_KEY;

if (typeof process !== 'undefined' && process.env) {
  APP_ENV = process.env.REACT_APP_ENV || process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV;
  BASE_API_URL = process.env.REACT_APP_BASE_API_URL || process.env.NEXT_PUBLIC_BASE_API_URL || process.env.BASE_API_URL;
  ZAP_API_URL = process.env.REACT_APP_ZAP_API_URL || process.env.NEXT_PUBLIC_ZAP_API_URL || process.env.ZAP_API_URL;
  API_KEY = process.env.REACT_APP_DZAP_API_KEY || process.env.NEXT_PUBLIC_DZAP_API_KEY || process.env.DZAP_API_KEY;
}

const baseUrl = BASE_API_URL || 'https://api.dzap.io';

const zapBaseUrl = ZAP_API_URL || 'https://zap.dzap.io';

export const appEnv = APP_ENV || AppEnv.development;

export const apiKey = API_KEY || undefined;

export const versionPostfix = 'v1/';

export const getBaseUrl = (): string => {
  return `${baseUrl}/${versionPostfix}`;
};

export const getBaseZapUrl = (): string => {
  return `${zapBaseUrl}/${versionPostfix}`;
};
