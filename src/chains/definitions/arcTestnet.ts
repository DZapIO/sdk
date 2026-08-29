import { arcTestnet as ArcTestnet } from 'viem/chains';
import { extendViemChain } from '../../utils/extendViemChain';

export const arcTestnet = extendViemChain(ArcTestnet, {
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 6,
  },
  rpcUrls: {
    default: {
      ...ArcTestnet.rpcUrls.default,
      http: [...ArcTestnet.rpcUrls.default.http, 'https://rpc.drpc.testnet.arc.network'],
    },
  },
});
