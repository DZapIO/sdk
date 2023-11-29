import { ContractInterface } from 'ethers';
import { abi as swapAbiV1point2 } from '../artifacts/v1.2/DZapAggregator';
import { abi as swapAbiV2 } from '../artifacts/v2/DZapAggregator';

export const baseUrl = 'https://dzap-staging-v2-lqtpzlbt3q-lz.a.run.app/';
// export const baseUrl = 'http://localhost:8080/';
// export const baseUrl = "https://api.dzap.io/";

export type DeFiContract = {
  [key: string]: {
    abi: ContractInterface;
    [key: number]: string;
  };
};

export const defaultSwapVersion = 'v2';

export const SWAP_CONTRACTS: DeFiContract = {
  'v1.2': {
    1: '0x3af3cc4930ef88F4afe0b695Ac95C230E1A108Ec',
    137: '0x3af3cc4930ef88F4afe0b695Ac95C230E1A108Ec',
    56: '0x3af3cc4930ef88F4afe0b695Ac95C230E1A108Ec',
    42161: '0x3af3cc4930ef88F4afe0b695Ac95C230E1A108Ec',
    abi: swapAbiV1point2,
  },
  v2: {
    137: '0x8cC264e741040a574f972b6688769584320bbb36',
    56: '0x8cC264e741040a574f972b6688769584320bbb36',
    10: '0x8cC264e741040a574f972b6688769584320bbb36',
    42161: '0x8cC264e741040a574f972b6688769584320bbb36',
    abi: swapAbiV2,
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
