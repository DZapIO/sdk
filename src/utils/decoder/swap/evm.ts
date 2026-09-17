import { decodeFunctionData } from 'viem/utils';
import { HexString } from '../../../types';
import { SwapAbisByFunctionName } from './abis';
import { TokenAmount, TokenMovements } from '../types';

const decodeSingleSwapData = (data: HexString): ReadonlyArray<TokenAmount> => {
  const decodedData = decodeFunctionData({ data, abi: SwapAbisByFunctionName.SingleSwap });
  return [decodedData?.args?.[4]];
};

const decodeMultiSwapData = (data: HexString): ReadonlyArray<TokenAmount> => {
  const decodedData = decodeFunctionData({ data, abi: SwapAbisByFunctionName.MultiSwapAbi });
  return decodedData?.args?.[4];
};

const decodeBatchPermitSwapData = (data: HexString): ReadonlyArray<TokenAmount> => {
  const decodedData = decodeFunctionData({ data, abi: SwapAbisByFunctionName.BatchPermitSwapAbi });
  return decodedData?.args?.[5]?.permitted;
};

const decodeGaslessExecuteMultiSwapData = (data: HexString): ReadonlyArray<TokenAmount> => {
  const decodedData = decodeFunctionData({ data, abi: SwapAbisByFunctionName.GaslessExecuteMultiSwapAbi });
  return decodedData?.args?.[7];
};

const decodeGaslessExecuteMultiSwapWithWitnessData = (data: HexString): ReadonlyArray<TokenAmount> => {
  const decodedData = decodeFunctionData({ data, abi: SwapAbisByFunctionName.GaslessExecuteMultiSwapWithWitnessAbi });
  return decodedData?.args?.[7];
};

const decodeGaslessExecuteSwapData = (data: HexString): ReadonlyArray<TokenAmount> => {
  const decodedData = decodeFunctionData({ data, abi: SwapAbisByFunctionName.GaslessExecuteSwapAbi });
  return [decodedData?.args?.[7]];
};

const swapFunctionSignatureWithInputTokenIndex: Record<HexString, (data: HexString) => ReadonlyArray<TokenAmount>> = {
  '0x50d52584': decodeSingleSwapData,
  '0x8de34776': decodeMultiSwapData,
  '0x8d44ea24': decodeBatchPermitSwapData,
  '0xd367ada5': decodeGaslessExecuteMultiSwapData,
  '0xdcdc6089': decodeGaslessExecuteMultiSwapWithWitnessData,
  '0x0d2eedd4': decodeGaslessExecuteSwapData,
};

export const decodeEvmSwapInput = ({ data }: { data?: HexString }): TokenMovements | undefined => {
  if (!data || data === '0x') {
    return undefined;
  }
  const functionSignature = data.slice(0, 10) as HexString;
  const decoder = swapFunctionSignatureWithInputTokenIndex[functionSignature];
  if (!decoder) {
    return undefined;
  }
  const sent = decoder(data).filter((item) => item?.token && item?.amount);
  if (sent.length === 0) {
    return undefined;
  }
  // calldata only carries what the swap was given; what came back is known from the event
  return { sent };
};
