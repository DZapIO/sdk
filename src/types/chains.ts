import { exclusiveChainIds } from '../constants/chains';

export type ExclusiveChainIds = (typeof exclusiveChainIds)[keyof typeof exclusiveChainIds];
