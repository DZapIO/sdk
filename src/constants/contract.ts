import { ContractConfig } from 'src/types/contract';
import { Services, Versions } from '../enums';

const CHAINS_IDS = {
  ethereum: 1,
  polygon: 137,
  bsc: 56,
  gnosis: 100,
  fantom: 250,
  avalanche: 43114,
  arbitrum: 42161,
  optimism: 10,
  zkSync: 324,
  base: 8453,
  scroll: 534352,
  manta: 169,
};

export const contractAddress: ContractConfig = {
  [Services.Dca]: {
    [Versions.V1]: {
      address: {
        [CHAINS_IDS.polygon]: '0x603B31bBE692aDCD522E280019F72b7919d6167c',
        [CHAINS_IDS.arbitrum]: '0x603B31bBE692aDCD522E280019F72b7919d6167c',
        [CHAINS_IDS.zkSync]: '0x3d2A3e5F13B7204cA39530D27e87184030e1F2Df',
        [CHAINS_IDS.optimism]: '0x603B31bBE692aDCD522E280019F72b7919d6167c',
        [CHAINS_IDS.base]: '0x603B31bBE692aDCD522E280019F72b7919d6167c',
      },
      abi: 'dZap/dca/v1/DZapDCA.json',
    },
  },
  [Services.BatchSwap]: {
    [Versions.V2]: {
      address: {
        [CHAINS_IDS.ethereum]: '0xF708e11A7C94abdE8f6217B13e6fE39C8b9cC0a6',
        [CHAINS_IDS.polygon]: '0xF708e11A7C94abdE8f6217B13e6fE39C8b9cC0a6',
        [CHAINS_IDS.bsc]: '0xF708e11A7C94abdE8f6217B13e6fE39C8b9cC0a6',
        [CHAINS_IDS.arbitrum]: '0xF708e11A7C94abdE8f6217B13e6fE39C8b9cC0a6',
        [CHAINS_IDS.optimism]: '0xF708e11A7C94abdE8f6217B13e6fE39C8b9cC0a6',
        [CHAINS_IDS.manta]: '0xF708e11A7C94abdE8f6217B13e6fE39C8b9cC0a6',
        [CHAINS_IDS.base]: '0xF708e11A7C94abdE8f6217B13e6fE39C8b9cC0a6',
        [CHAINS_IDS.avalanche]: '0xF708e11A7C94abdE8f6217B13e6fE39C8b9cC0a6',
        [CHAINS_IDS.scroll]: '0xF708e11A7C94abdE8f6217B13e6fE39C8b9cC0a6',
        [CHAINS_IDS.zkSync]: '0x244C41d354F8311b68C8B934f2A43EADb93f2E2F',
      },
      abi: 'dZap/core/V2/DZapCore.json',
    },
  },
  [Services.CrossChain]: {
    [Versions.V2]: {
      address: {
        [CHAINS_IDS.ethereum]: '0xF708e11A7C94abdE8f6217B13e6fE39C8b9cC0a6',
        [CHAINS_IDS.polygon]: '0xF708e11A7C94abdE8f6217B13e6fE39C8b9cC0a6',
        [CHAINS_IDS.bsc]: '0xF708e11A7C94abdE8f6217B13e6fE39C8b9cC0a6',
        [CHAINS_IDS.arbitrum]: '0xF708e11A7C94abdE8f6217B13e6fE39C8b9cC0a6',
        [CHAINS_IDS.optimism]: '0xF708e11A7C94abdE8f6217B13e6fE39C8b9cC0a6',
        [CHAINS_IDS.base]: '0xF708e11A7C94abdE8f6217B13e6fE39C8b9cC0a6',
        [CHAINS_IDS.scroll]: '0xF708e11A7C94abdE8f6217B13e6fE39C8b9cC0a6',
        [CHAINS_IDS.avalanche]: '0xF708e11A7C94abdE8f6217B13e6fE39C8b9cC0a6',
        [CHAINS_IDS.zkSync]: '0x244C41d354F8311b68C8B934f2A43EADb93f2E2F',
      },
      abi: 'dZap/core/V2/DZapCore.json',
    },
  },
} as const;
