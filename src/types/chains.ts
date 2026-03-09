import type { chainTypes, exclusiveChainIds } from '../constants/chains';

export type ExclusiveChainIds = (typeof exclusiveChainIds)[keyof typeof exclusiveChainIds];

export type ChainType = keyof typeof chainTypes;
