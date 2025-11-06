import * as viemChains from 'viem/chains';
import { arthera } from './definations/arthera';
import { fiveIre } from './definations/fiveIre';
import { hyperEvm } from './definations/hyperEvm';
import { hyperliquid } from './definations/hyperliquid';

export { arthera } from './definations/arthera';
export { fiveIre } from './definations/fiveIre';
export { hyperEvm } from './definations/hyperEvm';

export const customViemChains = [fiveIre, arthera, hyperEvm, hyperliquid];

export const viemChainsById: Record<number, viemChains.Chain> = [...Object.values(viemChains), ...customViemChains].reduce((acc, chainData) => {
  return chainData.id
    ? {
        ...acc,
        [chainData.id]: chainData,
      }
    : acc;
}, {});
