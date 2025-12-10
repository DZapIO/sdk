import { defineChain } from 'viem';

export const stableChain = /*#__PURE__*/ defineChain({
  id: 988,
  name: 'Stable',
  nativeCurrency: {
    name: 'GUSDT',
    symbol: 'gUSDT',
    decimals: 18,
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 2591807,
    },
  },
  blockExplorers: {
    default: {
      name: 'Stablescan',
      url: 'https://stablescan.xyz',
    },
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.stable.xyz'],
      webSocket: ['wss://rpc.stable.xyz'],
    },
  },
});
