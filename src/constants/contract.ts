import { HexString } from 'src/types';
import { ExclusiveChainIds } from 'src/types/chains';
import { exclusiveChainIds } from './chains';

export const exclusivePermit2Addresses: { [key: ExclusiveChainIds]: HexString } = {
  [exclusiveChainIds.zkSync]: '0x0000000000225e31D15943971F47aD3022F714Fa',
  [exclusiveChainIds.arthera]: '0x5Aeec43fF96b9B6c5a1dC1DAdA662ACE3c236C49',
  [exclusiveChainIds.gnosis]: '0x5Aeec43fF96b9B6c5a1dC1DAdA662ACE3c236C49',
  [exclusiveChainIds.kaia]: '0x08208a5f56696E7AA3eAF7a307fa63B37bd8e8A5',
  [exclusiveChainIds.bounceBit]: '0x08208a5f56696E7AA3eAF7a307fa63B37bd8e8A5',
  [exclusiveChainIds.biFrost]: '0x08208a5f56696E7AA3eAF7a307fa63B37bd8e8A5',
  [exclusiveChainIds.flare]: '0x08208a5f56696E7AA3eAF7a307fa63B37bd8e8A5',
  [exclusiveChainIds.iotaEvm]: '0x08208a5f56696E7AA3eAF7a307fa63B37bd8e8A5',
  [exclusiveChainIds.opbnb]: '0x08208a5f56696E7AA3eAF7a307fa63B37bd8e8A5',
  [exclusiveChainIds.zkFair]: '0x08208a5f56696E7AA3eAF7a307fa63B37bd8e8A5',
  [exclusiveChainIds.bahamut]: '0x08208a5f56696E7AA3eAF7a307fa63B37bd8e8A5',
  [exclusiveChainIds.immutableZkevm]: '0x08208a5f56696E7AA3eAF7a307fa63B37bd8e8A5',
};

export const DEFAULT_PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
