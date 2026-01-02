import { bitlayer as Bitlayer } from 'viem/chains';
import { extendViemChain } from '../../utils/extendViemChain';

export const bitlayer = extendViemChain(Bitlayer, {
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 3225645,
    },
  },
});
