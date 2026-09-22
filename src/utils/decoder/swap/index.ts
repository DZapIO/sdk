import { config } from '../../../config';
import { chainTypes } from '../../../constants/chains';
import { SwapInfo } from '../../../types';
import { formatToken } from '../../tokens';
import { decodeSuivmTransaction } from '../suivm';
import { decodeSvmTransaction } from '../svm';
import {
  DecodeTransactionParameters,
  DecodeTransactionReturnType,
  SwapAmountsPatchResult,
  TokenAmount,
  TxTokenAmounts,
} from '../../../types/decoder';
import { decodeEvmTransaction } from './evm';

type ResolvedChainType = typeof chainTypes.evm | typeof chainTypes.svm | typeof chainTypes.suivm;

// evm reads the amounts out of the swap calldata, the others out of what the transaction moved
const transactionDecoders: Record<ResolvedChainType, (params: DecodeTransactionParameters) => DecodeTransactionReturnType> = {
  [chainTypes.evm]: decodeEvmTransaction,
  [chainTypes.svm]: decodeSvmTransaction,
  [chainTypes.suivm]: decodeSuivmTransaction,
};

// deposits of the same token add up, as the transaction moved all of them
const amountByToken = (tokenAmounts: ReadonlyArray<TokenAmount>): Record<string, bigint> =>
  tokenAmounts.reduce(
    (acc, cur) => {
      const token = formatToken(cur.token);
      acc[token] = (acc[token] ?? BigInt(0)) + cur.amount;
      return acc;
    },
    {} as Record<string, bigint>,
  );

const swapCountByToken = (tokens: ReadonlyArray<string>): Record<string, number> =>
  tokens.reduce(
    (acc, cur) => {
      const token = formatToken(cur);
      acc[token] = (acc[token] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

const applyTxTokenAmounts = (eventSwapInfo: SwapInfo[] | SwapInfo, txTokenAmounts: TxTokenAmounts): SwapAmountsPatchResult => {
  const swaps = Array.isArray(eventSwapInfo) ? eventSwapInfo : [eventSwapInfo];
  const sentByToken = amountByToken(txTokenAmounts.sent);
  const receivedByToken = amountByToken(txTokenAmounts.received ?? []);
  const swapsByFromToken = swapCountByToken(swaps.map((info) => info.fromToken));
  const swapsByToToken = swapCountByToken(swaps.map((info) => info.toToken));

  // the amounts a transaction moved are totals per token, so a token shared by several swaps says nothing about what each of them moved
  const amountOf = (amounts: Record<string, bigint>, swapCounts: Record<string, number>, token: string): bigint | undefined =>
    swapCounts[formatToken(token)] === 1 ? amounts[formatToken(token)] : undefined;

  let isAmountPatched = false;
  const patch = (info: SwapInfo): SwapInfo => {
    const fromAmount = amountOf(sentByToken, swapsByFromToken, info.fromToken);
    const returnToAmount = amountOf(receivedByToken, swapsByToToken, info.toToken);
    isAmountPatched = isAmountPatched || fromAmount !== undefined || returnToAmount !== undefined;
    return { ...info, fromAmount: fromAmount ?? info.fromAmount, returnToAmount: returnToAmount ?? info.returnToAmount };
  };

  const swapInfo = Array.isArray(eventSwapInfo) ? eventSwapInfo.map(patch) : patch(eventSwapInfo);
  return isAmountPatched
    ? { swapInfo, isAmountPatched }
    : { swapInfo, isAmountPatched, amountPatchError: 'no token amount of the transaction matched a swap token' };
};

// never throws: when the amounts can't be read from the transaction the swap info is returned as given, with the reason
export const patchSwapAmountsFromTx = async ({
  chainType,
  chainId,
  txHash,
  rpcUrls,
  eventSwapInfo,
}: {
  chainType: string;
  eventSwapInfo: SwapInfo[] | SwapInfo;
} & DecodeTransactionParameters): Promise<SwapAmountsPatchResult> => {
  const decodeTransaction = transactionDecoders[chainType as ResolvedChainType];
  if (!decodeTransaction) {
    return { swapInfo: eventSwapInfo, isAmountPatched: false, amountPatchError: `decoding ${chainType} transactions is not supported` };
  }
  try {
    const txTokenAmounts = await decodeTransaction({ txHash, chainId, rpcUrls: rpcUrls ?? config.getRpcUrlsByChainId(chainId) });
    if (!txTokenAmounts) {
      return { swapInfo: eventSwapInfo, isAmountPatched: false, amountPatchError: `no token amounts could be decoded from transaction ${txHash}` };
    }
    return applyTxTokenAmounts(eventSwapInfo, txTokenAmounts);
  } catch (error) {
    return { swapInfo: eventSwapInfo, isAmountPatched: false, amountPatchError: error instanceof Error ? error.message : String(error) };
  }
};
