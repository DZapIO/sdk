import { extendViemChain } from '../../utils/extendViemChain';
import { katana as Katana } from 'viem/chains';

export const katana = extendViemChain(Katana, {
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 1898013,
    },
  },
});
