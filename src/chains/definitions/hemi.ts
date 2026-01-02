import { extendViemChain } from '../../utils/extendViemChain';
import { hemi as Hemi } from 'viem/chains';

export const hemi = extendViemChain(Hemi, {
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 4502791,
    },
  },
});
