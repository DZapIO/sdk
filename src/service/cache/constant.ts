export const TOKENS_PRICE_EXPIRY = 15 * 60;

export const getTokensPriceCacheKey = (chainId: number) => `tokenPrices_${chainId}`;
