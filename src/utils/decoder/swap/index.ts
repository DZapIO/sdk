import { chainTypes } from '../../../constants/chains';
import { HexString, SwapInfo } from '../../../types';
import { formatToken } from '../../tokens';
import { decodeSuivmTokenMovements } from '../suivm';
import { decodeSvmTokenMovements } from '../svm';
import { TokenAmount, TokenMovements } from '../types';
import { decodeEvmSwapInput } from './evm';

type ResolvedChainType = typeof chainTypes.evm | typeof chainTypes.svm | typeof chainTypes.suivm;

type DecoderParams = { data?: HexString; txHash?: string; rpcUrls?: string[] };

// evm reads the amounts out of the swap calldata, the others out of what the transaction moved
const decoders: Record<ResolvedChainType, (params: DecoderParams) => TokenMovements | undefined | Promise<TokenMovements | undefined>> = {
  [chainTypes.evm]: decodeEvmSwapInput,
  [chainTypes.svm]: decodeSvmTokenMovements,
  [chainTypes.suivm]: decodeSuivmTokenMovements,
};

const amountByToken = (tokenAmounts: ReadonlyArray<TokenAmount>): Record<string, bigint> =>
  tokenAmounts.reduce(
    (acc, cur) => {
      acc[formatToken(cur.token)] = cur.amount;
      return acc;
    },
    {} as Record<string, bigint>,
  );

const patchSwapInfo = (eventSwapInfo: SwapInfo[] | SwapInfo, movements: TokenMovements): SwapInfo[] | SwapInfo => {
  const sentByToken = amountByToken(movements.sent);
  const receivedByToken = movements.received ? amountByToken(movements.received) : undefined;

  const patch = (info: SwapInfo): SwapInfo => ({
    ...info,
    fromAmount: sentByToken[formatToken(info.fromToken)] ?? info.fromAmount,
    returnToAmount: (receivedByToken && receivedByToken[formatToken(info.toToken)]) ?? info.returnToAmount,
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
    const movements = await decoder({ data, txHash, rpcUrls });
    if (!movements) {
      return eventSwapInfo;
    }
    return patchSwapInfo(eventSwapInfo, movements);
  } catch (error) {
    return eventSwapInfo;
  }
};
