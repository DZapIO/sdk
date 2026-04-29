import { AppEnv } from '../enums';

// Global SDK configuration store
type Config = {
  apiKey: string | null;
  rpcUrlsByChainId: Record<number, string[]>;
  eip2612DisabledChains: number[];
  appEnv: string;
  baseApiUrl: string;
  zapApiUrl: string;
  versionPostfix: string;
};

// Environment variable extraction
let APP_ENV: string | undefined;
let BASE_API_URL: string | undefined;
let ZAP_API_URL: string | undefined;
let API_KEY: string | undefined;

if (typeof process !== 'undefined' && process.env) {
  APP_ENV = process.env.REACT_APP_ENV || process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV;
  BASE_API_URL = process.env.REACT_APP_BASE_API_URL || process.env.NEXT_PUBLIC_BASE_API_URL || process.env.BASE_API_URL;
  ZAP_API_URL = process.env.REACT_APP_ZAP_API_URL || process.env.NEXT_PUBLIC_ZAP_API_URL || process.env.ZAP_API_URL;
  API_KEY = process.env.REACT_APP_DZAP_API_KEY || process.env.NEXT_PUBLIC_DZAP_API_KEY || process.env.DZAP_API_KEY;
}

export function createConfig() {
  const config: Config = {
    apiKey: API_KEY || null,
    rpcUrlsByChainId: {},
    eip2612DisabledChains: [747474], // Katana chain ID
    appEnv: APP_ENV || AppEnv.development,
    baseApiUrl: BASE_API_URL || 'https://api.dzap.io',
    zapApiUrl: ZAP_API_URL || 'https://zap.dzap.io',
    versionPostfix: 'v1/',
  };

  return {
    // API Key methods
    getApiKey: () => config.apiKey,
    setApiKey: (apiKey: string) => {
      config.apiKey = apiKey;
    },

    // RPC URLs methods
    getRpcUrlsByChainId: (chainId: number) => config.rpcUrlsByChainId[chainId],
    setRpcUrlsByChainId: (rpcUrlsByChainId: Record<number, string[]>) => {
      config.rpcUrlsByChainId = rpcUrlsByChainId;
    },

    // Chain configuration methods
    getEip2612DisabledChains: () => config.eip2612DisabledChains,
    setEip2612DisabledChains: (chains: number[]) => {
      config.eip2612DisabledChains = chains;
    },

    // Environment methods
    getAppEnv: () => config.appEnv,
    setAppEnv: (env: string) => {
      config.appEnv = env;
    },

    // URL methods
    getBaseApiUrl: () => config.baseApiUrl,
    setBaseApiUrl: (url: string) => {
      config.baseApiUrl = url;
    },
    getZapApiUrl: () => config.zapApiUrl,
    setZapApiUrl: (url: string) => {
      config.zapApiUrl = url;
    },
    getVersionPostfix: () => config.versionPostfix,
    setVersionPostfix: (postfix: string) => {
      config.versionPostfix = postfix;
    },

    // Helper methods
    getBaseUrl: () => `${config.baseApiUrl}/${config.versionPostfix}`,
    getBaseZapUrl: () => `${config.zapApiUrl}/${config.versionPostfix}`,
  };
}

export const config = createConfig();
