import { Abi, parseEventLogs, ParseEventLogsReturnType, Transaction, TransactionReceipt } from 'viem';
import { AvailableDZapServices, Chain, SwapInfo } from '../../types';
import { ContractVersion } from '../../enums';
import { getDZapAbi } from './abi';
import { formatToken } from '../token/tokens';
import { getTokensPairKey } from '../token/tokenKeys';
import { SwapInputDataDecoder } from '../decoder/swap/inputDataDecoder';

/**
 * Decodes transaction data and extracts swap information from logs
 * @param transaction - The transaction object
 * @param receipt - The transaction receipt
 * @param service - The DZap service being used
 * @param chain - The chain configuration
 * @returns An object containing swap information and any failed swap pairs
 */
export const handleDecodeTxnData = (
  transaction: Transaction,
  receipt: TransactionReceipt,
  service: AvailableDZapServices,
  chain: Chain,
): { swapFailPairs: string[]; swapInfo: SwapInfo | SwapInfo[] } => {
  let events: ParseEventLogsReturnType<Abi, undefined, true, any> = [];
  const dZapAbi = getDZapAbi(service, chain?.version || ContractVersion.v1);
  try {
    events = parseEventLogs({
      abi: dZapAbi,
      logs: receipt.logs,
    });
  } catch (e) {
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
    new SwapInputDataDecoder().updateSwapInfo({
      data: transaction.input,
      eventSwapInfo: swapInfo,
    }) || swapInfo;

  return { swapInfo: updatedSwapInfo, swapFailPairs };
};
