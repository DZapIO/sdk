import * as viemChains from 'viem/chains';
import { arthera } from './definitions/arthera';
import { astralisTestnet } from './definitions/astralisTestnet';
import { fiveIre } from './definitions/fiveIre';
import { hyperEvm } from './definitions/hyperEvm';
import { hyperliquid } from './definitions/hyperliquid';
import { pushTestnet } from './definitions/pushTestnet';
import { stableChain } from './definitions/stable';
import { tempo } from './definitions/tempo';

export { arthera } from './definitions/arthera';
export { astralisTestnet } from './definitions/astralisTestnet';
export { fiveIre } from './definitions/fiveIre';
export { hyperEvm } from './definitions/hyperEvm';
export { hyperliquid } from './definitions/hyperliquid';
export { pushTestnet } from './definitions/pushTestnet';
export { stableChain } from './definitions/stable';
export { tempo } from './definitions/tempo';

export const customViemChains = [fiveIre, arthera, hyperEvm, hyperliquid, stableChain, pushTestnet, astralisTestnet, tempo];

export const viemChainsById: Record<number, viemChains.Chain> = [...Object.values(viemChains), ...customViemChains].reduce((acc, chainData) => {
  return chainData.id
    ? {
        ...acc,
        [chainData.id]: chainData,
      }
    : acc;
}, {});
