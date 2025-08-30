export const ZAP_ENDPOINTS = {
  status: '/status',
  config: {
    chains: '/config/chains',
    providers: '/config/providers',
  },
  pools: '/pools',
  poolDetails: '/pool/details',
  route: '/route',
  positions: '/user/positions',
  buildTx: '/buildTx',
  quote: '/quote',
  token: {
    details: (address: string, chainId: number) => `/token/details?address=${address}&chainId=${chainId}`,
  },
};
