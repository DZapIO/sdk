import { defineChain } from 'viem';

export const hyperliquid = /*#__PURE__*/ defineChain({
  id: 998,
  name: 'Hyperliquid',
  nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 13051,
    },
  },
  blockExplorers: {
    default: {
      name: 'Hyperliquid Scan',
      url: 'https://app.hyperliquid.xyz/explorer',
    },
  },
  rpcUrls: {
    default: {
      http: ['https://li.quest/v1/rpc/1337'],
    },
  },
});
