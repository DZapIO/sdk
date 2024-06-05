import { dZapCoreAbi } from '../artifacts';
import { Abi, Chain } from 'viem';
import { mainnet, arbitrum, bsc, optimism, polygon, zkSync } from 'viem/chains';
import { AppEnv } from './AppEnv';
const { REACT_APP_ENV, REACT_APP_BASE_API_URL } = process.env;

let baseUrl = REACT_APP_BASE_API_URL || 'https://api.dzap.io/';
const stagingUrl = 'https://staging.dzap.io/';
// const localhostUrl = 'http://localhost:8080/';
export const appEnv = REACT_APP_ENV || AppEnv.development;
export const isProd = appEnv === AppEnv.production;
export const isStaging = appEnv === AppEnv.staging;
export const versionPostfix = 'v1/';
export const getBaseUrl = (): string => {
  if (!isProd) {
    baseUrl = stagingUrl;
  }
  return `${baseUrl}${versionPostfix}`;
};

export type DeFiContract = {
  [key: string]: {
    abi: Abi;
    [key: number]: string;
  };
};

export const defaultSwapVersion = 'v2';

export const SWAP_ABIS: DeFiContract = {
  v2: {
    abi: dZapCoreAbi as Abi,
  },
};

export const defaultBridgeVersion = 'v2';

export const BRIDGE_ABIS: DeFiContract = {
  v2: {
    abi: dZapCoreAbi as Abi,
  },
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

export const Chains: { [key: number]: Chain } = {
  1: mainnet,
  10: optimism,
  56: bsc,
  137: polygon,
  42161: arbitrum,
  324: zkSync,
};
