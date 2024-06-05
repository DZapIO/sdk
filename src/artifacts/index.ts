import { dZapCoreAbi as defaultDZapCoreAbi, dZapDcaAbi, permit2Abi, erc20Abi } from './default';
import { dZapCoreAbi as stagingDZapCoreAbi } from './staging';
import { isStaging } from '../config';

const dZapCoreAbi = !isStaging ? defaultDZapCoreAbi : stagingDZapCoreAbi;

export { dZapCoreAbi, dZapDcaAbi, permit2Abi, erc20Abi };
