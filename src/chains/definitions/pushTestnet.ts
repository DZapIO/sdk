import { defineChain } from 'viem';

export const pushTestnet = /*#__PURE__*/ defineChain({
  id: 42101,
  name: 'Push Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'PC',
    symbol: 'PC',
  },
  rpcUrls: {
    default: { http: ['https://evm.rpc-testnet-donut-node1.push.org'] },
  },
  blockExplorers: {
    default: {
      name: 'Push Testnet Scan',
      url: 'https://donut.push.network',
    },
  },
  contracts: {
    multicall3: {
      address: '0xd74bAE15b413e0a90A7B2C1723F4A9c15cb49f73',
      blockCreated: 209259,
    },
  },
});
