import { defineChain } from 'viem';

export const fiveIre = /*#__PURE__*/ defineChain({
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
