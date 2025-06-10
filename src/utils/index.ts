import { DZapAbis, OtherAbis, Services, dZapNativeTokenFormat } from 'src/constants';
import { StatusCodes, TxnStatus } from 'src/enums';
import {
  Abi,
  ParseEventLogsReturnType,
  TransactionReceipt,
  WalletClient,
  createPublicClient,
  fallback,
  getAddress,
  http,
  isAddress,
  parseEventLogs,
  stringToHex,
} from 'viem';
import * as ABI from '../artifacts';
import { batchSwapIntegrators, isStaging } from '../config';
import { AvailableDZapServices, Chain, HexString, OtherAvailableAbis, SwapInfo } from '../types';

import { Signer } from 'ethers';
import { nativeTokens, zeroAddress } from 'src/constants/address';
import { RPC_BATCHING_WAIT_TIME, RPC_RETRY_DELAY } from 'src/constants/rpc';
import { viemChainsById } from './chains';

const publicClientRpcConfig = { batch: { wait: RPC_BATCHING_WAIT_TIME }, retryDelay: RPC_RETRY_DELAY };

export const initializeReadOnlyProvider = ({ rpcUrls, chainId }: { rpcUrls: string[] | undefined; chainId: number }) => {
  return createPublicClient({
    chain: viemChainsById[chainId],
    transport: fallback(rpcUrls ? rpcUrls.map((rpc: string) => http(rpc, publicClientRpcConfig)) : [http()]),
  });
};

export const isNativeCurrency = (contract: string) => nativeTokens.includes(contract);

export const getChecksumAddress = (address: string): HexString => getAddress(address);

export const formatToken = <T extends HexString | string>(token: T, nativeTokenAddress: T = zeroAddress as T): T => {
  if (!isAddress(token)) {
    return token;
  } else if (isNativeCurrency(token)) {
    return nativeTokenAddress;
  } else {
    return getChecksumAddress(token) as T;
  }
};

export function getTokensPairKey({
  srcToken,
  destToken,
  srcChainId,
  destChainId,
  forceIncludeChainId,
  srcChainNativeAddress = zeroAddress,
  destChainNativeAddress = zeroAddress,
}: {
  srcToken: string;
  destToken: string;
  srcChainId?: number;
  destChainId?: number;
  forceIncludeChainId?: boolean;
  srcChainNativeAddress?: string;
  destChainNativeAddress?: string;
}): string {
  const srcFormattedAddress = formatToken(srcToken, srcChainNativeAddress);
  const destFormattedAddress = formatToken(destToken, destChainNativeAddress);

  if ((!srcChainId || !destChainId || srcChainId === destChainId) && !forceIncludeChainId) {
    return `${srcFormattedAddress}-${destFormattedAddress}`;
  }
  return `${srcChainId}_${srcFormattedAddress}-${destChainId}_${destFormattedAddress}`;
}

export const readContract = async ({
  chainId,
  contractAddress,
  abi,
  functionName,
  rpcUrls,
  args = [],
}: {
  chainId: number;
  contractAddress: HexString;
  abi: Abi;
  functionName: string;
  rpcUrls?: string[];
  args?: unknown[];
}) => {
  try {
    const result = await initializeReadOnlyProvider({ chainId, rpcUrls }).readContract({
      address: contractAddress,
      abi,
      functionName,
      args,
    });
    return { data: result, status: TxnStatus.success, code: StatusCodes.Success };
  } catch (e: any) {
    console.log({ e });
    return { status: TxnStatus.error, code: e.code || StatusCodes.Error };
  }
};

export const writeContract = async ({
  chainId,
  contractAddress,
  abi,
  functionName,
  args = [],
  value = '0',
  rpcUrls = [''],
  signer,
}: {
  chainId: number;
  contractAddress: HexString;
  abi: Abi;
  functionName: string;
  args?: unknown[];
  value?: string;
  rpcUrls?: string[];
  signer: WalletClient;
}) => {
  const publicClient = initializeReadOnlyProvider({ chainId, rpcUrls });
  try {
    const { request } = await publicClient.simulateContract({
      address: contractAddress,
      abi,
      functionName,
      args,
      account: signer.account,
      value: BigInt(value),
    });
    const hash = await signer.writeContract(request);
    return { txnHash: hash, status: TxnStatus.success, code: StatusCodes.Success };
  } catch (e: any) {
    console.log({ e });
    if (e?.code === StatusCodes.UserRejectedRequest) {
      return { status: TxnStatus.rejected, code: e?.code, txnHash: '' };
    }
    return { status: TxnStatus.error, code: e?.code, txnHash: '' };
  }
};

export const calcTotalSrcTokenAmount = (data: { amount: string }[]) => {
  return data.reduce((acc, obj) => {
    return acc + BigInt(obj.amount);
  }, BigInt(0));
};

export const isOneToMany = (firstTokenAddress: string, secondTokenAddress: string) => firstTokenAddress === secondTokenAddress;

export const getIntegratorInfo = (integrator: string) => batchSwapIntegrators[integrator] || batchSwapIntegrators.dZap;

export const generateUUID = () => {
  let d = new Date().getTime();
  let d2 = (typeof performance !== 'undefined' && performance.now && performance.now() * 1000) || 0;
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxxx-xxxxxxxxxxxx-xxxxxxxxxxxx-xxxxxx-xxxxxxxx'.replace(/[xy]/g, (c) => {
    let r = Math.random() * 16;
    if (d > 0) {
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
  const uuidInBytes = stringToHex(uuid, { size: 32 });
  return uuidInBytes;
};

export const getTrxId = (account: string) => {
  const uuid = `${account.slice(0, 6)}...${account.slice(36, 42)}-${Date.now()}`;
  console.log(uuid);

  const uuidInBytes = stringToHex(uuid, { size: 32 });
  return uuidInBytes;
};

export const estimateGasMultiplier = BigInt(15) / BigInt(10); // .toFixed(0);

export const isTypeSigner = (variable: any): variable is Signer => {
  return variable instanceof Signer;
};

export const isDZapNativeToken = (srcToken: string) => srcToken === dZapNativeTokenFormat;

export const getDZapAbi = (service: AvailableDZapServices) => {
  switch (service) {
    case Services.swap:
    case Services.bridge:
      return isStaging ? ABI[DZapAbis.stagingDZapCoreAbi] : ABI[DZapAbis.dZapCoreAbi];
    case Services.dca:
      return ABI[DZapAbis.dZapDcaAbi];
    case Services.zap:
    default:
      throw new Error('Invalid Service');
  }
};

export const handleDecodeTrxData = (
  data: TransactionReceipt,
  service: AvailableDZapServices,
  chain: Chain,
): { swapFailPairs: string[]; swapInfo: SwapInfo | SwapInfo[] } => {
  let events: ParseEventLogsReturnType<Abi, undefined, true, any> = [];
  const dzapAbi = getDZapAbi(service);
  try {
    events = parseEventLogs({
      abi: dzapAbi,
      logs: data.logs,
    });
  } catch (e) {
    events = [];
  }

  events = events?.filter((item: any) => item !== null);
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

  return { swapInfo, swapFailPairs };
};

export const getOtherAbis = (name: OtherAvailableAbis) => {
  switch (name) {
    case OtherAbis.permit2:
      return ABI.permit2Abi;
    case OtherAbis.erc20:
      return ABI.erc20Abi;
    default:
      throw new Error('Invalid Abi');
  }
};
