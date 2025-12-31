import * as viemChains from 'viem/chains';
import { arthera } from './definitions/arthera';
import { fiveIre } from './definitions/fiveIre';
import { hyperEvm } from './definitions/hyperEvm';
import { hyperliquid } from './definitions/hyperliquid';
import { stableChain } from './definitions/stable';
import { bitlayer } from './definitions/bitlayer';
import { hemi } from './definitions/hemi';
import { merlin } from './definitions/merlin';
import { katana } from './definitions/katana';

export { arthera } from './definitions/arthera';
export { fiveIre } from './definitions/fiveIre';
export { hyperEvm } from './definitions/hyperEvm';
export { hyperliquid } from './definitions/hyperliquid';
export { stableChain } from './definitions/stable';

export const customViemChains = [fiveIre, arthera, hyperEvm, hyperliquid, stableChain, bitlayer, hemi, merlin, katana];

export const viemChainsList: viemChains.Chain[] = [...Object.values(viemChains), ...customViemChains];

export const viemChainsById: Record<number, viemChains.Chain> = viemChainsList.reduce((acc, chainData) => {
  return chainData.id
    ? {
        ...acc,
        [chainData.id]: chainData,
      }
    : acc;
}, {});
