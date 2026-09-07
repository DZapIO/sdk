import { ChainId, defineChain } from '@bigmi/core';

export const bitcoinTestnet = /*#__PURE__*/ defineChain({
  id: ChainId.BITCOIN_TESTNET4,
  name: 'Bitcoin Testnet',
  nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 8 },
  rpcUrls: {
    default: {
      http: ['https://bitcoin-testnet4.gateway.tatum.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mempool',
      url: 'https://mempool.space/testnet4',
    },
  },
  testnet: true,
});
