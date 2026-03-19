import { tempoModerato } from 'viem/chains';
import { tempoNativeToken } from '../../constants/address';

export const tempo = tempoModerato.extend({
  feeToken: tempoNativeToken,
});
