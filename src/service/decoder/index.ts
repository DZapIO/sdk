import type { Abi, ParseEventLogsReturnType, Transaction, TransactionReceipt } from 'viem';
import { decodeFunctionData, parseEventLogs } from 'viem';

import { SwapAbisByFunctionName } from '../../artifacts';
import { ContractVersion } from '../../enums';
import type { AvailableDZapServices, Chain, HexString, SwapInfo } from '../../types';
import { formatToken } from '../../utils/address';
import { getTokensPairKey } from '../../utils/token';
import { ContractsService } from '../contracts';

export class SwapDecoder {
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
    } catch {
      return eventSwapInfo;
    }
  };

  /**
   * Decodes transaction data and extracts swap information from logs
   * @param transaction - The transaction object
   * @param receipt - The transaction receipt
   * @param service - The DZap service being used
   * @param chain - The chain configuration
   * @returns An object containing swap information and any failed swap pairs
   */
  public decodeTransactionData(
    transaction: Transaction,
    receipt: TransactionReceipt,
    service: AvailableDZapServices,
    chain: Chain,
  ): { swapFailPairs: string[]; swapInfo: SwapInfo | SwapInfo[] } {
    let events: ParseEventLogsReturnType<Abi, undefined, true, any> = [];
    const dZapAbi = ContractsService.getDZapAbi(service, chain?.version || ContractVersion.v1);
    try {
      events = parseEventLogs({
        abi: dZapAbi,
        logs: receipt.logs,
      });
    } catch {
      events = [];
    }

    events = events?.filter((item) => item !== null);
    const txLogArgs = events[0]?.args as { swapInfo: SwapInfo | SwapInfo[] };
    const swapFailPairs: string[] = [];

    let swapInfo: SwapInfo | SwapInfo[] = [];
    if (Array.isArray(txLogArgs?.swapInfo)) {
      swapInfo = txLogArgs.swapInfo.map((info) => {
        if (BigInt(info.returnToAmount) === BigInt(0) || BigInt(info.fromAmount) === BigInt(0)) {
          swapFailPairs.push(
            getTokensPairKey({
              srcToken: info.fromToken,
              destToken: info.toToken,
              srcChainId: chain.chainId,
              destChainId: chain.chainId,
              srcChainNativeAddress: chain?.nativeToken?.contract,
              destChainNativeAddress: chain?.nativeToken?.contract,
            }),
          );
        }
        return {
          ...info,
          fromToken: formatToken(info.fromToken, chain?.nativeToken?.contract),
          toToken: formatToken(info.toToken, chain?.nativeToken?.contract),
        };
      });
    } else if (typeof txLogArgs?.swapInfo === 'object' && Object.keys(txLogArgs?.swapInfo).length > 0) {
      const { fromAmount, returnToAmount, fromToken, toToken } = txLogArgs.swapInfo;
      if (BigInt(returnToAmount) === BigInt(0) || BigInt(fromAmount) === BigInt(0)) {
        swapFailPairs.push(
          getTokensPairKey({
            srcToken: fromToken,
            destToken: toToken,
            srcChainId: chain.chainId,
            destChainId: chain.chainId,
            srcChainNativeAddress: chain?.nativeToken?.contract,
            destChainNativeAddress: chain?.nativeToken?.contract,
          }),
        );
      }
      swapInfo = {
        ...txLogArgs.swapInfo,
        fromToken: formatToken(txLogArgs.swapInfo.fromToken, chain?.nativeToken?.contract),
        toToken: formatToken(txLogArgs.swapInfo.toToken, chain?.nativeToken?.contract),
      };
    }

    // update swap info with input data
    const updatedSwapInfo =
      this.updateSwapInfo({
        data: transaction.input,
        eventSwapInfo: swapInfo,
      }) || swapInfo;

    return { swapInfo: updatedSwapInfo, swapFailPairs };
  }
}
