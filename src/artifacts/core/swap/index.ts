import { batchPermitSwapAbi } from './BatchPermitSwap.abi';
import { gaslessExecuteMultiSwapAbi } from './gasless/ExecuteMultiSwap.abi';
import { gaslessExecuteMultiSwapWithWitnessAbi } from './gasless/ExecuteMultiSwapWithWitness.abi';
import { gaslessExecuteSwapAbi } from './gasless/ExecuteSwap.abi';
import { multiSwapAbi } from './MultiSwap.abi';
import { singleSwapAbi } from './SingleSwap.abi';

export { batchPermitSwapAbi } from './BatchPermitSwap.abi';
export * from './gasless';
export { multiSwapAbi } from './MultiSwap.abi';
export { singleSwapAbi } from './SingleSwap.abi';

export const SwapAbisByFunctionName = {
  SingleSwapAbi: singleSwapAbi,
  MultiSwapAbi: multiSwapAbi,
  BatchPermitSwapAbi: batchPermitSwapAbi,
  GaslessExecuteSwapAbi: gaslessExecuteSwapAbi,
  GaslessExecuteMultiSwapAbi: gaslessExecuteMultiSwapAbi,
  GaslessExecuteMultiSwapWithWitnessAbi: gaslessExecuteMultiSwapWithWitnessAbi,
};
