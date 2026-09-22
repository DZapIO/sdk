import { Abi, parseEventLogs, ParseEventLogsReturnType, TransactionReceipt } from 'viem';
import { getDZapAbi, getPublicClient, getTokensPairKey } from '..';
import { chainTypes } from '../../constants/chains';
import { ContractVersion } from '../../enums';
import { Chain, HexString, SwapInfo } from '../../types';
import {
  DecodeEvmTxnDataParams,
  DecodeSuivmTxnDataParams,
  DecodeSvmTxnDataParams,
  DecodeTxnDataParams,
  DecodeTxnDataResponse,
} from '../../types/decoder';
import { formatToken } from '../tokens';
import { patchSwapAmountsFromTx } from './swap';

const formatSwapInfoTokens = (info: SwapInfo, chain: Chain): SwapInfo => ({
  ...info,
  fromToken: formatToken(info.fromToken, chain?.nativeToken?.contract),
  toToken: formatToken(info.toToken, chain?.nativeToken?.contract),
});

type SwapInfoReadResult = { txHash: string; swapInfo: SwapInfo | SwapInfo[] };

const isEvmDecodeParams = (params: DecodeTxnDataParams): params is DecodeEvmTxnDataParams => params.chain.chainType === chainTypes.evm;

// the receipt is fetched by txHash when the caller did not already have it
const getTxReceipt = async ({ chain, receipt, txHash, rpcUrls }: DecodeEvmTxnDataParams): Promise<TransactionReceipt> => {
  if (receipt) {
    return receipt;
  }
  if (!txHash) {
    throw new Error('receipt or txHash is required to decode an evm transaction');
  }
  return getPublicClient({ chainId: chain.chainId, rpcUrls }).getTransactionReceipt({ hash: txHash as HexString });
};

// the swap info of an evm transaction is read from the event its dZap contract emitted
const readEvmSwapInfo = async (params: DecodeEvmTxnDataParams): Promise<SwapInfoReadResult> => {
  const { chain, service } = params;
  const txReceipt = await getTxReceipt(params);

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
const readGivenSwapInfo = async ({
  chain,
  txHash,
  eventSwapInfo,
}: DecodeSvmTxnDataParams | DecodeSuivmTxnDataParams): Promise<SwapInfoReadResult> => {
  if (!txHash || !eventSwapInfo) {
    throw new Error(`txHash and eventSwapInfo are required to decode a ${chain.chainType} transaction`);
  }
  return { txHash, swapInfo: eventSwapInfo };
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
  const { txHash, swapInfo } = isEvmDecodeParams(params) ? await readEvmSwapInfo(params) : await readGivenSwapInfo(params);

  // the amounts actually swapped are read from the transaction itself, on chain types that support it
  const patchResult = await patchSwapAmountsFromTx({ chainType: chain.chainType, chainId: chain.chainId, txHash, rpcUrls, eventSwapInfo: swapInfo });

  return { ...patchResult, swapFailPairs: getSwapFailPairs(patchResult.swapInfo, chain) };
};
