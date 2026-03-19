import { tempo as tempoViem } from 'viem/chains';
import { tempoNativeToken } from '../../constants/address';

export const tempo = tempoViem.extend({
  feeToken: tempoNativeToken,
});
