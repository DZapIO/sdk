import { tempo as tempoViem } from 'viem/chains';

export const tempo = tempoViem.extend({
  feeToken: '0x20C0000000000000000000000000000000000000',
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 775442,
    },
  },
});
