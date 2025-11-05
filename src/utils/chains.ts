import { defineChain } from 'viem';
import * as viemChains from 'viem/chains';

// @dev kept for reference

// const blast = defineChain({
//   id: 81457,
//   name: 'Blast',
//   nativeCurrency: {
//     decimals: 18,
//     name: 'Ether',
//     symbol: 'ETH',
//   },
//   rpcUrls: {
//     default: { http: ['https://rpc.blast.io'] },
//   },
//   blockExplorers: {
//     default: {
//       name: 'Blastscan',
//       url: 'https://blastscan.io',
//       apiUrl: 'https://api.blastscan.io/api',
//     },
//   },
//   contracts: {
//     multicall3: {
//       address: '0xcA11bde05977b3631167028862bE2a173976CA11',
//       blockCreated: 212929,
//     },
//   },
//   sourceId: 1,
// });

const fiveIre = /*#__PURE__*/ defineChain({
  id: 995,
  name: '5ire',
  nativeCurrency: {
    decimals: 18,
    name: '5ire',
    symbol: '5ire',
  },
  rpcUrls: {
    default: { http: ['https://rpc.5ire.network'] },
  },
  blockExplorers: {
    default: {
      name: '5ire Scan',
      url: 'https://5irescan.io',
    },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 47416,
    },
  },
});

const arthera = /*#__PURE__*/ defineChain({
  id: 10242,
  name: 'Arthera',
  nativeCurrency: {
    decimals: 18,
    name: 'AA',
    symbol: 'AA',
  },
  rpcUrls: {
    default: { http: ['https://rpc.arthera.net'] },
  },
  blockExplorers: {
    default: {
      name: 'Arthera Scan',
      url: 'https://explorer.arthera.net',
    },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 4502791,
    },
  },
});

export const hyperEvm = /*#__PURE__*/ defineChain({
  id: 999,
  name: 'HyperEVM',
  nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 13051,
    },
  },
  blockExplorers: {
    default: {
      name: 'HyperEVMScan',
      url: 'https://hyperevmscan.io/',
    },
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.hyperliquid.xyz/evm', 'https://rpc.hypurrscan.io', 'https://hyperliquid-json-rpc.stakely.io'],
    },
  },
});

export const hyperLiquid = /*#__PURE__*/ defineChain({
  id: 998,
  name: 'Hyper Liquid',
  nativeCurrency: { name: 'ETH', symbol: 'HYPE', decimals: 18 },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 13051,
    },
  },
  blockExplorers: {
    default: {
      name: 'Hyper Liquid Scan',
      url: 'https://app.hyperliquid.xyz/explorer',
    },
  },
  rpcUrls: {
    default: {
      http: ['https://li.quest/v1/rpc/1337'],
    },
  },
});

export const viemChainsById: Record<number, viemChains.Chain> = [...Object.values(viemChains), fiveIre, arthera, hyperEvm, hyperLiquid].reduce(
  (acc, chainData) => {
    return chainData.id
      ? {
          ...acc,
          [chainData.id]: chainData,
        }
      : acc;
  },
  {},
);
