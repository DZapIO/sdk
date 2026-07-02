import { defineChain } from 'viem';

export const robinhood = /*#__PURE__*/ defineChain({
  id: 4663,
  name: 'Robinhood',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://rpc.mainnet.chain.robinhood.com'] },
  },
  blockExplorers: {
    default: {
      name: 'Robinhood Scan',
      url: 'https://robinhoodchain.blockscout.com',
    },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 406,
    },
  },
});
