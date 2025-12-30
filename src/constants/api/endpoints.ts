export const ZAP_ENDPOINTS = {
  status: 'status',
  config: {
    chains: 'config/chains',
    providers: 'config/providers',
  },
  pools: 'pools',
  poolDetails: 'pool/details',
  positions: 'user/positions',
  buildTx: 'buildTx',
  quote: 'quote',
  broadcast: 'broadcast',
};

export const TRADE_ENDPOINTS = {
  swap: {
    quote: 'swap/quote',
    buildTx: 'swap/buildTx',
  },
  bridge: {
    quote: 'bridge/quote',
    buildTx: 'bridge/buildTx',
  },
  quotes: 'quotes',
  buildTx: 'buildTx',
  gasless: {
    executeTx: 'gasless/executeTx',
  },
  broadcast: 'broadcast',
  chains: 'chains',
  token: {
    tokens: 'token/tokens',
    details: 'token/details',
    price: 'token/price',
    balanceOf: 'token/balance-of',
  },
  status: 'status',
  user: {
    calculatePoints: 'user/calculatePoints',
  },
};
