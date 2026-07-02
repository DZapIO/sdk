import * as viemChains from 'viem/chains';
import { arthera } from './definitions/arthera';
import { astralisTestnet } from './definitions/astralisTestnet';
import { citrea } from './definitions/citrea';
import { fiveIre } from './definitions/fiveIre';
import { hemi } from './definitions/hemi';
import { hyperEvm } from './definitions/hyperEvm';
import { hyperliquid } from './definitions/hyperliquid';
import { pushTestnet } from './definitions/pushTestnet';
import { robinhood } from './definitions/robinhood';
import { stableChain } from './definitions/stable';
import { tempo } from './definitions/tempo';

export { arthera } from './definitions/arthera';
export { astralisTestnet } from './definitions/astralisTestnet';
export { citrea } from './definitions/citrea';
export { fiveIre } from './definitions/fiveIre';
export { hemi } from './definitions/hemi';
export { hyperEvm } from './definitions/hyperEvm';
export { hyperliquid } from './definitions/hyperliquid';
export { pushTestnet } from './definitions/pushTestnet';
export { stableChain } from './definitions/stable';
export { tempo } from './definitions/tempo';
export { robinhood } from './definitions/robinhood';

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
  robinhood,
];

export const viemChainsById: Record<number, viemChains.Chain> = [...Object.values(viemChains), ...customViemChains].reduce((acc, chainData) => {
  return chainData.id
    ? {
        ...acc,
        [chainData.id]: chainData,
      }
    : acc;
}, {});
