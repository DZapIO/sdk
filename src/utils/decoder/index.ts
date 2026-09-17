import { Abi, parseEventLogs, ParseEventLogsReturnType } from 'viem';
import { getDZapAbi, getPublicClient, getTokensPairKey } from '..';
import { chainTypes } from '../../constants/chains';
import { ContractVersion } from '../../enums';
import { Chain, HexString, SwapInfo } from '../../types';
import { DecodeTxnDataParams, DecodeTxnDataResponse } from '../../types/decoder';
import { formatToken } from '../tokens';
import { patchSwapAmountsFromTx } from './swap';

const formatSwapInfoTokens = (info: SwapInfo, chain: Chain): SwapInfo => ({
  ...info,
  fromToken: formatToken(info.fromToken, chain?.nativeToken?.contract),
  toToken: formatToken(info.toToken, chain?.nativeToken?.contract),
});

type SwapInfoReader = (params: DecodeTxnDataParams) => Promise<{ txHash: string; swapInfo: SwapInfo | SwapInfo[] }>;

// the swap info of an evm transaction is read from the event its dZap contract emitted
const readEvmSwapInfo: SwapInfoReader = async ({ service, chain, receipt, txHash, rpcUrls }) => {
  if (!receipt && !txHash) {
    throw new Error('receipt or txHash is required to decode an evm transaction');
  }
  const txReceipt = receipt ?? (await getPublicClient({ chainId: chain.chainId, rpcUrls }).getTransactionReceipt({ hash: txHash as HexString }));

  let events: ParseEventLogsReturnType<Abi, undefined, true, any> = [];
  const dZapAbi = getDZapAbi(service, chain?.version || ContractVersion.v1);
  try {
    events = parseEventLogs({ abi: dZapAbi, logs: txReceipt.logs });
  } catch (e) {
    events = [];
  }
  const eventSwapInfo = (events?.filter((item: any) => item !== null)[0]?.args as { swapInfo?: SwapInfo | SwapInfo[] })?.swapInfo;

  let swapInfo: SwapInfo | SwapInfo[] = [];
  if (Array.isArray(eventSwapInfo)) {
    swapInfo = eventSwapInfo.map((info) => formatSwapInfoTokens(info, chain));
  } else if (typeof eventSwapInfo === 'object' && Object.keys(eventSwapInfo).length > 0) {
    swapInfo = formatSwapInfoTokens(eventSwapInfo, chain);
  }
  return { txHash: txReceipt.transactionHash, swapInfo };
};

// chains without a dZap event to read take the swap info (e.g. the quote) from the caller
const readGivenSwapInfo: SwapInfoReader = async ({ chain, txHash, eventSwapInfo }) => {
  if (!txHash || !eventSwapInfo) {
    throw new Error(`txHash and eventSwapInfo are required to decode a ${chain.chainType} transaction`);
  }
  return { txHash, swapInfo: eventSwapInfo };
};

const swapInfoReaders: Partial<Record<string, SwapInfoReader>> = {
  [chainTypes.evm]: readEvmSwapInfo,
};

// a swap that gave nothing back failed for its token pair
const getSwapFailPairs = (swapInfo: SwapInfo | SwapInfo[], chain: Chain): string[] =>
  (Array.isArray(swapInfo) ? swapInfo : [swapInfo])
    .filter((info) => BigInt(info.returnToAmount) === BigInt(0))
    .map((info) =>
      getTokensPairKey({
        srcToken: info.fromToken,
        destToken: info.toToken,
        srcChainId: chain.chainId,
        destChainId: chain.chainId,
        srcChainNativeAddress: chain?.nativeToken?.contract,
        destChainNativeAddress: chain?.nativeToken?.contract,
      }),
    );

export const decodeTxnData = async (params: DecodeTxnDataParams): Promise<DecodeTxnDataResponse> => {
  const { chain, rpcUrls } = params;
  const readSwapInfo = swapInfoReaders[chain.chainType] ?? readGivenSwapInfo;
  const { txHash, swapInfo } = await readSwapInfo(params);

  // the amounts actually swapped are read from the transaction itself, on chain types that support it
  const patchResult = await patchSwapAmountsFromTx({ chainType: chain.chainType, chainId: chain.chainId, txHash, rpcUrls, eventSwapInfo: swapInfo });

  return { ...patchResult, swapFailPairs: getSwapFailPairs(patchResult.swapInfo, chain) };
};
