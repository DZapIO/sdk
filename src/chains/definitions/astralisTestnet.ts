import { defineChain } from 'viem';

export const astralisTestnet = /*#__PURE__*/ defineChain({
  id: 71261,
  name: 'Astralis Chain',
  nativeCurrency: {
    decimals: 18,
    name: 'ASTCH',
    symbol: 'ASTCH',
  },
  rpcUrls: {
    default: { http: ['https://test-rpc.astralischain.com'] },
  },
  blockExplorers: {
    default: {
      name: 'Astralis Testnet Explorer',
      url: 'https://test-explorer.astralischain.com',
    },
  },
  contracts: {
    multicall3: {
      address: '0xd74bAE15b413e0a90A7B2C1723F4A9c15cb49f73',
      blockCreated: 260214,
    },
  },
});
