import * as viemChains from 'viem/chains';
import { arcTestnet } from './definitions/arcTestnet';
import { arthera } from './definitions/arthera';
import { astralisTestnet } from './definitions/astralisTestnet';
import { bitlayer } from './definitions/bitlayer';
import { citrea } from './definitions/citrea';
import { fiveIre } from './definitions/fiveIre';
import { hemi } from './definitions/hemi';
import { hyperEvm } from './definitions/hyperEvm';
import { hyperliquid } from './definitions/hyperliquid';
import { katana } from './definitions/katana';
import { merlin } from './definitions/merlin';
import { pushTestnet } from './definitions/pushTestnet';
import { robinhood } from './definitions/robinhood';
import { stableChain } from './definitions/stable';
import { tempo } from './definitions/tempo';

export { arcTestnet } from './definitions/arcTestnet';
export { arthera } from './definitions/arthera';
export { astralisTestnet } from './definitions/astralisTestnet';
export { bitlayer } from './definitions/bitlayer';
export { bitcoin } from '@bigmi/core';
export { bitcoinTestnet } from './definitions/bitcoinTestnet';
export { citrea } from './definitions/citrea';
export { fiveIre } from './definitions/fiveIre';
export { hemi } from './definitions/hemi';
export { hyperEvm } from './definitions/hyperEvm';
export { hyperliquid } from './definitions/hyperliquid';
export { katana } from './definitions/katana';
export { merlin } from './definitions/merlin';
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
  arcTestnet,
  bitlayer,
  merlin,
  katana,
];

export const viemChainsById: Record<number, viemChains.Chain> = [...Object.values(viemChains), ...customViemChains].reduce((acc, chainData) => {
  return chainData.id
    ? {
        ...acc,
        [chainData.id]: chainData,
      }
    : acc;
}, {});
