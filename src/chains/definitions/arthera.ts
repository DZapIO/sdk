import { defineChain } from 'viem';

export const arthera = /*#__PURE__*/ defineChain({
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
