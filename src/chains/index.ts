import * as viemChains from 'viem/chains';
import { arthera } from './definitions/arthera';
import { astralisTestnet } from './definitions/astralisTestnet';
import { fiveIre } from './definitions/fiveIre';
import { hemi } from './definitions/hemi';
import { hyperEvm } from './definitions/hyperEvm';
import { hyperliquid } from './definitions/hyperliquid';
import { pushTestnet } from './definitions/pushTestnet';
import { stableChain } from './definitions/stable';
import { tempo } from './definitions/tempo';
import { citrea } from './definitions/citrea';

export { arthera } from './definitions/arthera';
export { astralisTestnet } from './definitions/astralisTestnet';
export { fiveIre } from './definitions/fiveIre';
export { hemi } from './definitions/hemi';
export { hyperEvm } from './definitions/hyperEvm';
export { hyperliquid } from './definitions/hyperliquid';
export { pushTestnet } from './definitions/pushTestnet';
export { stableChain } from './definitions/stable';
export { tempo } from './definitions/tempo';
export { citrea } from './definitions/citrea';

export const customViemChains: viemChains.Chain[] = [
  fiveIre,
  arthera,
  hyperEvm,
  hyperliquid,
  stableChain,
  pushTestnet,
  astralisTestnet,
  tempo,
  hemi,
  citrea,
];

export const viemChainsById: Record<number, viemChains.Chain> = [...Object.values(viemChains), ...customViemChains].reduce((acc, chainData) => {
  return chainData.id
    ? {
        ...acc,
        [chainData.id]: chainData,
      }
    : acc;
}, {});
