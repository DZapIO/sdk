import { chainTypes } from '../../../constants/chains';
import { HexString, SwapInfo } from '../../../types';
import { formatToken } from '../../tokens';
import { decodeEvmSwapAmounts } from './evm';
import { decodeSuivmSwapAmounts } from './suivm';
import { decodeSvmSwapAmounts } from './svm';
import { SwapAmountDecodeResult, TokenAmount } from './types';

type ResolvedChainType = typeof chainTypes.evm | typeof chainTypes.svm | typeof chainTypes.suivm;

type SwapAmountDecoderParams = { data?: HexString; txHash?: string; rpcUrls?: string[] };

const decoders: Record<
  ResolvedChainType,
  (params: SwapAmountDecoderParams) => SwapAmountDecodeResult | undefined | Promise<SwapAmountDecodeResult | undefined>
> = {
  [chainTypes.evm]: decodeEvmSwapAmounts,
  [chainTypes.svm]: decodeSvmSwapAmounts,
  [chainTypes.suivm]: decodeSuivmSwapAmounts,
};

const toTokenAmountMap = (tokenAmounts: ReadonlyArray<TokenAmount>): Record<string, bigint> =>
  tokenAmounts.reduce(
    (acc, cur) => {
      acc[formatToken(cur.token)] = cur.amount;
      return acc;
    },
    {} as Record<string, bigint>,
  );

const patchSwapInfo = (eventSwapInfo: SwapInfo[] | SwapInfo, result: SwapAmountDecodeResult): SwapInfo[] | SwapInfo => {
  const inputAmountByToken = toTokenAmountMap(result.input);
  const outputAmountByToken = result.output ? toTokenAmountMap(result.output) : undefined;

  const patch = (info: SwapInfo): SwapInfo => ({
    ...info,
    fromAmount: inputAmountByToken[formatToken(info.fromToken)] ?? info.fromAmount,
    returnToAmount: (outputAmountByToken && outputAmountByToken[formatToken(info.toToken)]) ?? info.returnToAmount,
  });

  return Array.isArray(eventSwapInfo) ? eventSwapInfo.map(patch) : patch(eventSwapInfo);
};

export const updateSwapInfo = async ({
  chainType,
  eventSwapInfo,
  data,
  txHash,
  rpcUrls,
}: {
  chainType?: string;
  eventSwapInfo?: SwapInfo[] | SwapInfo;
  data?: HexString;
  txHash?: string;
  rpcUrls?: string[];
}): Promise<SwapInfo[] | SwapInfo | undefined> => {
  if (!eventSwapInfo || !chainType) {
    return eventSwapInfo;
  }
  const decoder = decoders[chainType as ResolvedChainType];
  if (!decoder) {
    return eventSwapInfo;
  }
  try {
    const result = await decoder({ data, txHash, rpcUrls });
    if (!result) {
      return eventSwapInfo;
    }
    return patchSwapInfo(eventSwapInfo, result);
  } catch (error) {
    return eventSwapInfo;
  }
};
