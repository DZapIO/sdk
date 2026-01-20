import { erc20PermitAbi } from '../artifacts';
import { config } from '../config';
import { ERC20_FUNCTIONS } from '../constants/erc20';
import { DEFAULT_PERMIT_VERSION } from '../constants/permit';
import { TxnStatus } from '../enums';
import { CacheProvider } from '../service/cache/cacheProvider';
import { EIP2612_SUPPORT_CACHE_EXPIRY, getEIP2612SupportCacheKey } from '../service/cache/constant';
import type { HexString, TokenPermitData } from '../types';
import { multicall } from './multicall';

type EIP2612PermitData = {
  version: string;
  name: string;
  nonce: bigint;
};

/**
 * Lightweight check if a token supports EIP-2612 permits
 * Optimized for allowance checks - only returns support status, no nonce data
 * Uses token.permit data if available, otherwise checks cache, then minimal RPC call
 */
export const checkEIP2612PermitSupport = async ({
  address,
  chainId,
  rpcUrls,
  permit,
}: {
  chainId: number;
  address: HexString;
  rpcUrls?: string[];
  permit?: TokenPermitData;
}): Promise<{
  supportsPermit: boolean;
}> => {
  if (config.eip2612DisabledChains.includes(chainId)) {
    return { supportsPermit: false };
  }

  if (permit?.eip2612?.supported === false) {
    return { supportsPermit: false };
  }

  if (permit?.eip2612?.supported === true) {
    return { supportsPermit: true };
  }

  const cacheKey = getEIP2612SupportCacheKey(chainId, address);
  const cachedSupport = CacheProvider.get<boolean>(cacheKey);
  if (cachedSupport !== undefined) {
    return { supportsPermit: cachedSupport };
  }

  const contracts = [
    {
      address: address as HexString,
      abi: erc20PermitAbi,
      functionName: ERC20_FUNCTIONS.domainSeparator,
    },
  ];

  const multicallResult = await multicall({
    chainId,
    contracts,
    rpcUrls,
    allowFailure: true,
  });

  const results = multicallResult.data as Array<{ status: string; result: unknown }>;
  const supportsPermit = multicallResult.status === TxnStatus.success && results.length > 0 && results[0]?.status === TxnStatus.success;

  CacheProvider.set(cacheKey, supportsPermit, EIP2612_SUPPORT_CACHE_EXPIRY);

  return { supportsPermit };
};

/**
 * Get full EIP-2612 permit data including nonce, version, and name
 * Optimized for signature service - always fetches nonce via RPC
 * Uses caching to avoid redundant calls when called after allowance check
 */
export const getEIP2612PermitData = async ({
  address,
  chainId,
  rpcUrls,
  owner,
  permit,
}: {
  chainId: number;
  address: HexString;
  rpcUrls?: string[];
  owner: HexString;
  permit?: TokenPermitData;
}): Promise<{
  supportsPermit: boolean;
  data?: EIP2612PermitData;
}> => {
  // Check disabled chains first
  if (config.eip2612DisabledChains.includes(chainId)) {
    return { supportsPermit: false };
  }

  // Use token permit data if available to determine support
  if (permit?.eip2612?.supported === false) {
    return { supportsPermit: false };
  }

  // Fetch all details in one multicall
  const contracts = [
    {
      address: address as HexString,
      abi: erc20PermitAbi,
      functionName: ERC20_FUNCTIONS.domainSeparator,
    },
    {
      address: address as HexString,
      abi: erc20PermitAbi,
      functionName: ERC20_FUNCTIONS.nonces,
      args: [owner],
    },
    {
      address: address as HexString,
      abi: erc20PermitAbi,
      functionName: ERC20_FUNCTIONS.name,
    },
    {
      address: address as HexString,
      abi: erc20PermitAbi,
      functionName: ERC20_FUNCTIONS.version,
    },
  ];

  const multicallResult = await multicall({
    chainId,
    contracts,
    rpcUrls,
    allowFailure: true,
  });

  if (multicallResult.status !== TxnStatus.success) {
    return { supportsPermit: false };
  }

  const results = multicallResult.data as Array<{ status: string; result: unknown }>;
  const [domainSeparatorResult, nonceResult, nameResult, versionResult] = results;

  if (domainSeparatorResult.status !== TxnStatus.success || nonceResult.status !== TxnStatus.success || nameResult.status !== TxnStatus.success) {
    return { supportsPermit: false };
  }

  const data: EIP2612PermitData = {
    version: versionResult.status === TxnStatus.success ? (versionResult.result as string) : DEFAULT_PERMIT_VERSION,
    name: nameResult.result as string,
    nonce: nonceResult.result as bigint,
  };

  const supportCacheKey = getEIP2612SupportCacheKey(chainId, address);
  CacheProvider.set(supportCacheKey, true, EIP2612_SUPPORT_CACHE_EXPIRY);

  return {
    supportsPermit: true,
    data,
  };
};
