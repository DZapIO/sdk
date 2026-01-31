import type { Chain } from '@bigmi/core';
import { bitcoin } from '@bigmi/core';
import * as viemChains from 'viem/chains';

import { chainIds } from '../constants';
import { arthera } from './definitions/arthera';
import { bitcoinTestnet } from './definitions/bitcoin';
import { bitlayer } from './definitions/bitlayer';
import { fiveIre } from './definitions/fiveIre';
import { hemi } from './definitions/hemi';
import { hyperEvm } from './definitions/hyperEvm';
import { hyperliquid } from './definitions/hyperliquid';
import { katana } from './definitions/katana';
import { merlin } from './definitions/merlin';
import { stableChain } from './definitions/stable';

export { arthera } from './definitions/arthera';
export { bitcoinTestnet } from './definitions/bitcoin';
export { bitlayer } from './definitions/bitlayer';
export { fiveIre } from './definitions/fiveIre';
export { hemi } from './definitions/hemi';
export { hyperEvm } from './definitions/hyperEvm';
export { hyperliquid } from './definitions/hyperliquid';
export { katana } from './definitions/katana';
export { merlin } from './definitions/merlin';
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

export const bigmiChainsById: Record<number, Chain> = {
  [chainIds.bitcoin]: bitcoin,
  [chainIds.bitcoinTestnet]: bitcoinTestnet,
};
