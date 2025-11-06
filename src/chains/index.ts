import * as viemChains from 'viem/chains';
import { arthera } from './arthera';
import { fiveIre } from './fiveIre';
import { hyperEvm } from './hyperEvm';
import { hyperliquid } from './hyperliquid';

export { arthera } from './arthera';
export { fiveIre } from './fiveIre';
export { hyperEvm } from './hyperEvm';

export const viemChainsById: Record<number, viemChains.Chain> = [...Object.values(viemChains), fiveIre, arthera, hyperEvm, hyperliquid].reduce(
  (acc, chainData) => {
    return chainData.id
      ? {
          ...acc,
          [chainData.id]: chainData,
        }
      : acc;
  },
  {},
);
