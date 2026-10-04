import { ChainData } from '../../src/types';
import { chainTypes } from '../../src/constants/chains';
import { tonNativeToken } from '../../src/constants/address';

export const mockChainConfig: ChainData = {
  42161: {
    chainId: 42161,
    name: 'Arbitrum',
    chainType: chainTypes.evm,
    isEnabled: true,
    nativeToken: {
      contract: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      decimals: 18,
    },
    contracts: {},
  } as ChainData[number],
  7565164: {
    chainId: 7565164,
    name: 'Solana',
    chainType: chainTypes.svm,
    isEnabled: true,
    nativeToken: {
      contract: 'So11111111111111111111111111111111111111112',
      symbol: 'SOL',
      decimals: 9,
    },
    contracts: {},
  } as ChainData[number],
  1000: {
    chainId: 1000,
    name: 'Bitcoin',
    chainType: chainTypes.bvm,
    isEnabled: true,
    mainnet: true,
    nativeToken: {
      contract: 'btc',
      symbol: 'BTC',
      decimals: 8,
    },
    contracts: {},
  } as ChainData[number],
  116201519: {
    chainId: 116201519,
    name: 'Aptos',
    chainType: chainTypes.aptosvm,
    isEnabled: true,
    nativeToken: {
      contract: '0x1::aptos_coin::AptosCoin',
      symbol: 'APT',
      decimals: 8,
    },
    contracts: {},
  } as ChainData[number],
  19219: {
    chainId: 19219,
    name: 'Sui',
    chainType: chainTypes.suivm,
    isEnabled: true,
    nativeToken: {
      contract: '0x2::sui::SUI',
      symbol: 'SUI',
      decimals: 9,
    },
    contracts: {},
  } as ChainData[number],
  728126428: {
    chainId: 728126428,
    name: 'Tron',
    chainType: chainTypes.tronvm,
    isEnabled: true,
    nativeToken: {
      contract: 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb',
      symbol: 'TRX',
      decimals: 6,
    },
    contracts: {},
  } as ChainData[number],
  607: {
    chainId: 607,
    name: 'TON',
    chainType: chainTypes.tonvm,
    isEnabled: true,
    nativeToken: {
      contract: tonNativeToken,
      symbol: 'TON',
      decimals: 9,
    },
    contracts: {},
  } as ChainData[number],
};
