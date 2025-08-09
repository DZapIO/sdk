import { exclusiveChainIds } from 'src/constants/chains';

export type ExclusiveChainIds = (typeof exclusiveChainIds)[keyof typeof exclusiveChainIds];
