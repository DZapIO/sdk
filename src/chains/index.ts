import * as viemChains from 'viem/chains';
import { arthera } from './definitions/arthera';
import { fiveIre } from './definitions/fiveIre';
import { hyperEvm } from './definitions/hyperEvm';
import { hyperliquid } from './definitions/hyperliquid';

export { arthera } from './definitions/arthera';
export { fiveIre } from './definitions/fiveIre';
export { hyperEvm } from './definitions/hyperEvm';
export { hyperliquid } from './definitions/hyperliquid';

export const customViemChains = [fiveIre, arthera, hyperEvm, hyperliquid];

export const viemChainsById: Record<number, viemChains.Chain> = [...Object.values(viemChains), ...customViemChains].reduce((acc, chainData) => {
  return chainData.id
    ? {
        ...acc,
        [chainData.id]: chainData,
      }
    : acc;
}, {});
