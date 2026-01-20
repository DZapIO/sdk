import type { HexString } from '../../types';

export const TOKENS_PRICE_EXPIRY = 15 * 60;

export const getTokensPriceCacheKey = (chainId: number) => `tokenPrices_${chainId}`;

// Cache expiry for EIP-2612 permit support checks (30 minutes)
export const EIP2612_SUPPORT_CACHE_EXPIRY = 30 * 60;

export const getEIP2612SupportCacheKey = (chainId: number, address: HexString) => `eip2612_support_${chainId}_${address.toLowerCase()}`;
