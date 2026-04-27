import { citrea as Citrea } from 'viem/chains';
import { extendViemChain } from '../../utils/extendViemChain';

export const citrea = extendViemChain(Citrea, {
  contracts: {
    multicall3: {
      address: '0xA738e84fdE890Bc60b99AF7ccE43990E534304de',
      blockCreated: 2450100,
    },
  },
});
