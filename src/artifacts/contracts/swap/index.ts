import { singleSwapAbi } from './SingleSwap.abi';
import { multiSwapAbi } from './MultiSwap.abi';
import { batchPermitSwapAbi } from './BatchPermitSwap.abi';
import { gaslessExecuteSwapAbi } from './gasless/ExecuteSwap.abi';
import { gaslessExecuteMultiSwapAbi } from './gasless/ExecuteMultiSwap.abi';
import { gaslessExecuteMultiSwapWithWitnessAbi } from './gasless/ExecuteMultiSwapWithWitness.abi';

export { singleSwapAbi } from './SingleSwap.abi';
export { multiSwapAbi } from './MultiSwap.abi';
export { batchPermitSwapAbi } from './BatchPermitSwap.abi';

export * from './gasless';

export const SwapAbisByFunctionName = {
  SingleSwap: singleSwapAbi,
  MultiSwapAbi: multiSwapAbi,
  BatchPermitSwapAbi: batchPermitSwapAbi,
  GaslessExecuteSwapAbi: gaslessExecuteSwapAbi,
  GaslessExecuteMultiSwapAbi: gaslessExecuteMultiSwapAbi,
  GaslessExecuteMultiSwapWithWitnessAbi: gaslessExecuteMultiSwapWithWitnessAbi,
};
