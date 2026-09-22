import { decodeFunctionData } from 'viem/utils';
import { getPublicClient } from '../..';
import { HexString } from '../../../types';
import { SwapAbisByFunctionName } from './abis';
import { DecodeTransactionParameters, DecodeTransactionReturnType, TokenAmount } from '../../../types/decoder';

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

export const decodeEvmTransaction = async ({ txHash, chainId, rpcUrls }: DecodeTransactionParameters): DecodeTransactionReturnType => {
  const { input } = await getPublicClient({ chainId, rpcUrls }).getTransaction({ hash: txHash as HexString });
  const decoder = swapFunctionSignatureWithInputTokenIndex[input.slice(0, 10) as HexString];
  if (!decoder) {
    return undefined;
  }
  const sent = decoder(input).filter((item) => item?.token && item?.amount);
  if (sent.length === 0) {
    return undefined;
  }
  // calldata only carries what the swap was given; what came back is known from the event
  return { sent };
};
