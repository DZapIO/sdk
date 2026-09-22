import { Abi, parseEventLogs, ParseEventLogsReturnType, TransactionReceipt } from 'viem';
import { getDZapAbi, getPublicClient, getTokensPairKey } from '..';
import { chainTypes } from '../../constants/chains';
import { ContractVersion } from '../../enums';
import { AvailableDZapServices, Chain, ChainData, HexString, SwapInfo } from '../../types';
import { DecodeTxnDataClientParams, DecodeTxnDataParamsByTxHash, DecodeTxnDataResponse } from '../../types/decoder';
import { formatToken } from '../tokens';
import { patchSwapAmountsFromTx } from './swap';

const formatSwapInfoTokens = (info: SwapInfo, chain: Chain): SwapInfo => ({
  ...info,
  fromToken: formatToken(info.fromToken, chain?.nativeToken?.contract),
  toToken: formatToken(info.toToken, chain?.nativeToken?.contract),
});

type SwapInfoReadResult = { txHash: string; swapInfo: SwapInfo | SwapInfo[] };

type DecodeContext = { params: DecodeTxnDataClientParams; chain: Chain; rpcUrls?: string[] };

// the receipt is fetched by txHash when the caller did not already have it
const getTxReceipt = async ({ chainId, txHash, rpcUrls }: { chainId: number; txHash: string; rpcUrls?: string[] }): Promise<TransactionReceipt> => {
  return getPublicClient({ chainId, rpcUrls }).getTransactionReceipt({ hash: txHash as HexString });
};

const decodeSwapInfoFromReceipt = async ({
  txReceipt,
  service,
  chain,
}: {
  txReceipt: TransactionReceipt;
  service: AvailableDZapServices;
  chain: Chain;
}): Promise<SwapInfoReadResult> => {
  let events: ParseEventLogsReturnType<Abi, undefined, true> = [];
  const dZapAbi = getDZapAbi(service, chain?.version || ContractVersion.v1);
  try {
    events = parseEventLogs({ abi: dZapAbi, logs: txReceipt.logs });
  } catch {
    events = [];
  }
  const eventSwapInfo = (events?.find((item) => item !== null)?.args as { swapInfo?: SwapInfo | SwapInfo[] })?.swapInfo;

  let swapInfo: SwapInfo | SwapInfo[] = [];
  if (Array.isArray(eventSwapInfo)) {
    swapInfo = eventSwapInfo.map((info) => formatSwapInfoTokens(info, chain));
  } else if (typeof eventSwapInfo === 'object' && Object.keys(eventSwapInfo).length > 0) {
    swapInfo = formatSwapInfoTokens(eventSwapInfo, chain);
  }
  return { txHash: txReceipt.transactionHash, swapInfo };
};

// the swap info of an evm transaction is read from the event its dZap contract emitted
const fetchReceiptAndDecodeSwapInfo = async ({
  params,
  chain,
  rpcUrls,
}: {
  params: DecodeTxnDataParamsByTxHash;
  chain: Chain;
  rpcUrls?: string[];
}): Promise<SwapInfoReadResult> => {
  const txReceipt = await getTxReceipt({ txHash: params.txHash, chainId: chain.chainId, rpcUrls });
  return decodeSwapInfoFromReceipt({ txReceipt, service: params.service, chain });
};

// chains without a dZap event to read take the swap info (e.g. the quote) from the caller
const readGivenSwapInfo = async ({ params }: { params: DecodeTxnDataClientParams }): Promise<SwapInfoReadResult> => {
  if ('txHash' in params && 'eventSwapInfo' in params && typeof params.eventSwapInfo === 'object' && Object.keys(params.eventSwapInfo).length > 0) {
    return { txHash: params.txHash, swapInfo: params.eventSwapInfo };
  }
  throw new Error('Invalid decode params');
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

const getSwapInfoForEvm = async ({ params, chain, rpcUrls }: DecodeContext): Promise<SwapInfoReadResult> => {
  if ('receipt' in params) {
    return await decodeSwapInfoFromReceipt({ txReceipt: params.receipt, service: params.service, chain });
  }
  if ('txHash' in params) {
    return await fetchReceiptAndDecodeSwapInfo({ params, chain, rpcUrls });
  }
  if ('eventSwapInfo' in params) {
    return await readGivenSwapInfo({ params });
  }
  throw new Error('Invalid decode params');
};

const chainDecoders: Record<string, (context: DecodeContext) => Promise<SwapInfoReadResult>> = {
  [chainTypes.evm]: getSwapInfoForEvm,
  [chainTypes.svm]: readGivenSwapInfo,
  [chainTypes.suivm]: readGivenSwapInfo,
};

export const decodeTxnData = async (params: DecodeTxnDataClientParams & { chainsConfig: ChainData }): Promise<DecodeTxnDataResponse> => {
  const { chainId, rpcUrls, chainsConfig } = params;
  const chain = chainsConfig[chainId];
  const decoder = chainDecoders[chain.chainType];
  if (!decoder) {
    throw new Error(`No decoder found for chain type ${chain.chainType}`);
  }
  const { txHash, swapInfo } = await decoder({ params, chain, rpcUrls });

  const patchResult = await patchSwapAmountsFromTx({ chainType: chain.chainType, chainId: chain.chainId, txHash, rpcUrls, eventSwapInfo: swapInfo });

  return { ...patchResult, swapFailPairs: getSwapFailPairs(patchResult.swapInfo, chain) };
};
