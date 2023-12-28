import { ContractInterface } from 'ethers';
import { abi as swapAbiV1point2 } from '../artifacts/v1.2/DZapAggregator';
import { abi as swapAbiV2 } from '../artifacts/v2/DZapAggregator';

export const baseUrl = 'https://staging.dzap.io/';
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
    137: '0xF708e11A7C94abdE8f6217B13e6fE39C8b9cC0a6',
    56: '0xF708e11A7C94abdE8f6217B13e6fE39C8b9cC0a6',
    10: '0xF708e11A7C94abdE8f6217B13e6fE39C8b9cC0a6',
    42161: '0xF708e11A7C94abdE8f6217B13e6fE39C8b9cC0a6',
    534352: '0xF708e11A7C94abdE8f6217B13e6fE39C8b9cC0a6',
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
