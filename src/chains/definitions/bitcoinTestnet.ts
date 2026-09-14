import { bitcoinChainIds, defineBitcoinChain } from './bitcoin';

export const bitcoinTestnet = /*#__PURE__*/ defineBitcoinChain({
  id: bitcoinChainIds.BITCOIN_TESTNET4,
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
