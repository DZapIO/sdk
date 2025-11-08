import { defineChain } from 'viem';

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
