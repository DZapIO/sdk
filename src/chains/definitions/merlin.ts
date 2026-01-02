import { extendViemChain } from '../../utils/extendViemChain';
import { merlin as Merlin } from 'viem/chains';

export const merlin = extendViemChain(Merlin, {
  contracts: {
    multicall3: {
      address: '0xa8DceBAd1ea2fCf86De386462C14D7629237CC88',
      blockCreated: 11997883,
    },
  },
});
