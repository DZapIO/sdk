import { HexString } from 'src/types';
import { ExclusiveChainIds } from 'src/types/chains';
import { exclusiveChainIds } from './chains';

export const exclusivePermit2Addresses: { [key: ExclusiveChainIds]: HexString } = {
  [exclusiveChainIds.zkSync]: '0x0000000000225e31D15943971F47aD3022F714Fa',
  [exclusiveChainIds.arthera]: '0x5Aeec43fF96b9B6c5a1dC1DAdA662ACE3c236C49',
  [exclusiveChainIds.gnosis]: '0x5Aeec43fF96b9B6c5a1dC1DAdA662ACE3c236C49',
};

export const DEFAULT_PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
