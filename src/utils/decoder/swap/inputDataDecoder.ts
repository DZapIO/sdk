import { decodeFunctionData } from 'viem/utils';
import { SwapAbisByFunctionName } from '../../../artifacts';
import { HexString, SwapInfo } from '../../../types';
import { formatToken } from '../../token/tokens';

export class SwapInputDataDecoder {
  private decodeSingleSwapData = (data: HexString): ReadonlyArray<{ token: HexString; amount: bigint }> => {
    const decodedData = decodeFunctionData({
      data,
      abi: SwapAbisByFunctionName.SingleSwapAbi,
    });
    return [decodedData?.args?.[4]];
  };

  private decodeMultiSwapData = (data: HexString): ReadonlyArray<{ token: HexString; amount: bigint }> => {
    const decodedData = decodeFunctionData({
      data,
      abi: SwapAbisByFunctionName.MultiSwapAbi,
    });
    return decodedData?.args?.[4];
  };

  private decodeBatchPermitSwapData = (data: HexString): ReadonlyArray<{ token: HexString; amount: bigint }> => {
    const decodedData = decodeFunctionData({
      data,
      abi: SwapAbisByFunctionName.BatchPermitSwapAbi,
    });
    const permitData = decodedData?.args?.[5]?.permitted;
    return permitData;
  };

  private decodeGaslessExecuteMultiSwapData = (data: HexString): ReadonlyArray<{ token: HexString; amount: bigint }> => {
    const decodedData = decodeFunctionData({
      data,
      abi: SwapAbisByFunctionName.GaslessExecuteMultiSwapAbi,
    });
    return decodedData?.args?.[7];
  };

  private decodeGaslessExecuteMultiSwapWithWitnessData = (data: HexString): ReadonlyArray<{ token: HexString; amount: bigint }> => {
    const decodedData = decodeFunctionData({
      data,
      abi: SwapAbisByFunctionName.GaslessExecuteMultiSwapWithWitnessAbi,
    });
    return decodedData?.args?.[7];
  };

  private decodeGaslessExecuteSwapData = (data: HexString): ReadonlyArray<{ token: HexString; amount: bigint }> => {
    const decodedData = decodeFunctionData({
      data,
      abi: SwapAbisByFunctionName.GaslessExecuteSwapAbi,
    });
    return [decodedData?.args?.[7]];
  };

  private readonly swapFunctionSignatureWithInputTokenIndex: Record<
    HexString,
    { name: string; decoder: (data: HexString) => ReadonlyArray<{ token: HexString; amount: bigint }> }
  > = {
    '0x50d52584': {
      name: 'singleSwap',
      decoder: this.decodeSingleSwapData,
    },
    '0x8de34776': {
      name: 'multiSwap',
      decoder: this.decodeMultiSwapData,
    },
    '0x8d44ea24': {
      name: 'batchPermitSwap',
      decoder: this.decodeBatchPermitSwapData,
    },
    '0xd367ada5': {
      name: 'gaslessExecuteMultiSwap',
      decoder: this.decodeGaslessExecuteMultiSwapData,
    },
    '0xdcdc6089': {
      name: 'gaslessExecuteMultiSwapWithWitness',
      decoder: this.decodeGaslessExecuteMultiSwapWithWitnessData,
    },
    '0x0d2eedd4': {
      name: 'gaslessExecuteSwap',
      decoder: this.decodeGaslessExecuteSwapData,
    },
  };

  public updateSwapInfo = ({
    data,
    eventSwapInfo,
  }: {
    eventSwapInfo?: SwapInfo[] | SwapInfo;
    data?: HexString;
  }): SwapInfo[] | SwapInfo | undefined => {
    try {
      if (!data || !eventSwapInfo || data === '0x') {
        return eventSwapInfo;
      }
      const functionSignature = data.slice(0, 10) as HexString;
      const decoder = this.swapFunctionSignatureWithInputTokenIndex[functionSignature]?.decoder;
      if (!decoder) {
        return eventSwapInfo;
      }

      const inputTokenData: ReadonlyArray<{ token: HexString; amount: bigint }> = decoder(data);
      if (!inputTokenData || inputTokenData.length === 0) {
        return eventSwapInfo;
      }

      // update input amount for each swap info
      const tokenToAmount = inputTokenData
        .filter((item) => item.token && item.amount)
        .reduce(
          (acc, cur) => {
            acc[formatToken(cur.token)] = cur.amount;
            return acc;
          },
          {} as Record<string, bigint>,
        );

      if (Array.isArray(eventSwapInfo)) {
        return eventSwapInfo.map((item) => {
          const formattedSrcToken = formatToken(item.fromToken);
          const inputAmount = tokenToAmount[formattedSrcToken] || item.fromAmount;
          return {
            ...item,
            fromAmount: inputAmount,
          };
        });
      } else {
        const formattedSrcToken = formatToken(eventSwapInfo.fromToken);
        const inputAmount = tokenToAmount[formattedSrcToken] || eventSwapInfo.fromAmount;
        return {
          ...eventSwapInfo,
          fromAmount: inputAmount,
        };
      }
    } catch (error) {
      return eventSwapInfo;
    }
  };
}
