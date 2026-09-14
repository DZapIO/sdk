export const bitcoinChainIds = {
  BITCOIN_MAINNET: 'bitcoin:mainnet',
  BITCOIN_TESTNET4: 'bitcoin:testnet4',
} as const;

export type BitcoinChainId = (typeof bitcoinChainIds)[keyof typeof bitcoinChainIds];

type BitcoinChainDefinition = {
  id: BitcoinChainId;
  name: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: { default: { http: readonly string[] } };
  blockExplorers?: { default: { name: string; url: string } };
  testnet?: boolean;
};

// Produces the same object shape as @bigmi/core's defineChain without depending on @bigmi/core
export const defineBitcoinChain = <const Chain extends BitcoinChainDefinition>(chain: Chain) => ({
  formatters: undefined,
  fees: undefined,
  serializers: undefined,
  ...chain,
});

export const bitcoin = /*#__PURE__*/ defineBitcoinChain({
  id: bitcoinChainIds.BITCOIN_MAINNET,
  name: 'Bitcoin',
  nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 8 },
  rpcUrls: {
    default: {
      http: ['https://node-router.thorswap.net/bitcoin'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mempool',
      url: 'https://mempool.space/',
    },
  },
});
