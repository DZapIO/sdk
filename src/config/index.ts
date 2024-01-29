import { abi as swapAbiV2 } from '../artifacts/v2/DZapAggregator';
import { Abi, Chain } from 'viem';
import { arbitrum, bsc, mainnet, optimism, polygon, zkSync } from 'viem/chains';
// export const baseUrl = 'https://dzap-staging-v2-1-lqtpzlbt3q-lz.a.run.app/';
export const baseUrl = 'http://localhost:8080/';
// export const baseUrl = "https://api.dzap.io/";

export type DeFiContract = {
  [key: string]: {
    abi: Abi;
    [key: number]: string;
  };
};

export const defaultSwapVersion = 'v2';

export const SWAP_CONTRACTS: DeFiContract = {
  v2: {
    137: '0x8cC264e741040a574f972b6688769584320bbb36',
    56: '0x8cC264e741040a574f972b6688769584320bbb36',
    10: '0x8cC264e741040a574f972b6688769584320bbb36',
    42161: '0x8cC264e741040a574f972b6688769584320bbb36',
    abi: swapAbiV2 as Abi,
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

export const ViemChains: { [key: number]: Chain } = {
  1: mainnet,
  10: optimism,
  56: bsc,
  137: polygon,
  42161: arbitrum,
  324: zkSync,
};
