import { Abi, createPublicClient, fallback, http, stringToHex, WalletClient, zeroAddress } from 'viem';
import * as ABI from '../artifacts';
import { AvailableDZapServices, HexString, OtherAvailableAbis } from '../types';

import { Signer } from 'ethers';
import { viemChainsById } from '../chains';
import { DZapAbis, dZapNativeTokenFormat, OtherAbis, Services } from '../constants';
import { RPC_BATCHING_WAIT_TIME, RPC_RETRY_DELAY } from '../constants/rpc';
import { ContractVersion, StatusCodes, TxnStatus } from '../enums';
import { formatToken } from './tokens';

const publicClientRpcConfig = { batch: { wait: RPC_BATCHING_WAIT_TIME }, retryDelay: RPC_RETRY_DELAY };

export const getPublicClient = ({ rpcUrls, chainId }: { rpcUrls: string[] | undefined; chainId: number }) => {
  const chain = viemChainsById[chainId];
  const urls = (rpcUrls?.length ? rpcUrls : chain?.rpcUrls?.default?.http) ?? [];
  const transports = urls.length ? urls.map((url: string) => http(url, publicClientRpcConfig)) : [http()];
  return createPublicClient({
    chain,
    transport: fallback(transports),
    batch: {
      multicall: {
        wait: RPC_BATCHING_WAIT_TIME,
      },
    },
  });
};

export function getTokensPairKey({
  srcToken,
  destToken,
  srcChainId,
  destChainId,
  srcChainNativeAddress = zeroAddress,
  destChainNativeAddress = zeroAddress,
}: {
  srcToken: string;
  destToken: string;
  srcChainId: number;
  destChainId: number;
  srcChainNativeAddress?: string;
  destChainNativeAddress?: string;
}): string {
  const srcFormattedAddress = formatToken(srcToken, srcChainNativeAddress);
  const destFormattedAddress = formatToken(destToken, destChainNativeAddress);
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
    const result = await getPublicClient({ chainId, rpcUrls }).readContract({
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
  const publicClient = getPublicClient({ chainId, rpcUrls });
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

export const generateUUID = () => {
  let d = new Date().getTime();
  let d2 = (typeof performance !== 'undefined' && performance.now && performance.now() * 1000) || 0;
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxxx-xxxxxxxxxxxx-xxxxxxxxxxxx-xxxxxx-xxxxxxxx'.replace(/[xy]/g, (c) => {
    let r = Math.random() * 16;
    if (d > 0) {
      r = ((d + r) % 16) | 0;
      d = Math.floor(d / 16);
    } else {
      r = ((d2 + r) % 16) | 0;
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

export const getDZapAbi = (service: AvailableDZapServices, version: ContractVersion) => {
  switch (service) {
    case Services.trade:
      switch (version) {
        case ContractVersion.v1:
          return ABI[DZapAbis.dZapCoreAbi];
        case ContractVersion.v2:
          return ABI[DZapAbis.dZapCoreV2Abi];
        default:
          throw new Error('Invalid Version for Trade');
      }
    case Services.dca:
      return ABI[DZapAbis.dZapDcaAbi];
    case Services.zap:
    default:
      throw new Error('Invalid Service');
  }
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
