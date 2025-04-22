import { ChainData } from 'src/types';
import { CoingeckoPriceProvider } from './provider/coingecko';
import { DefiLlamaPriceProvider } from './provider/defiLlama';
import { DzapPriceProvider } from './provider/dzap';
import { IPriceProvider, PriceProvider, priceProviders } from './types/IPriceProvider';
import { CacheProvider } from '../cache/cacheProvider';
import { getTokensPriceCacheKey, TOKENS_PRICE_EXPIRY } from '../cache/constant';

export class PriceService {
  private providers: Map<PriceProvider, IPriceProvider>;

  constructor() {
    this.providers = this.initailizeProviders();
  }

  private initailizeProviders(): Map<PriceProvider, IPriceProvider> {
    return new Map<PriceProvider, IPriceProvider>([
      [priceProviders.dZap, new DzapPriceProvider()],
      [priceProviders.defiLlama, new DefiLlamaPriceProvider()],
      [priceProviders.coingecko, new CoingeckoPriceProvider()],
    ]);
  }

  async getPrices({
    chainId,
    tokenAddresses,
    chainConfig,
    allowedSources,
    notAllowSources = [],
  }: {
    chainId: number;
    tokenAddresses: string[];
    chainConfig: ChainData | null;
    allowedSources?: PriceProvider[];
    notAllowSources?: PriceProvider[];
  }): Promise<Record<string, string | null>> {
    if (!tokenAddresses || tokenAddresses.length === 0) {
      console.warn('No token addresses provided');
      return {};
    }

    const validProviders = this.getValidProviders({ allowedSources, notAllowSources, chainConfig });

    if (validProviders.length === 0) {
      console.warn('No valid providers available based on the provided constraints');
      return {};
    }

    const cacheKey = getTokensPriceCacheKey(chainId);
    const cachedPrices = CacheProvider.get<Record<string, string>>(cacheKey) || {};
    const tokenWithPrice: Record<string, string> = {};
    const result: Record<string, string | null> = {};

    tokenAddresses.forEach((token) => {
      if (!cachedPrices?.[token]) {
        result[token] = null;
      }
    });

    for (const provider of validProviders) {
      const tokens = Object.keys(result).filter((token) => result[token] === null);
      if (tokens.length === 0) break;

      const fetchedPrices = await provider.fetchPrices(chainId, tokens, chainConfig);
      this.updateTokensPrice(fetchedPrices, result);
    }

    const remainingTokens: string[] = [];
    for (const [token, price] of Object.entries(result)) {
      if (price === null) {
        remainingTokens.push(token);
      } else {
        tokenWithPrice[token] = price;
      }
    }

    if (remainingTokens.length > 0) {
      console.warn('Prices not found for tokens:', remainingTokens);
    }

    if (Object.keys(tokenWithPrice).length > 0) {
      CacheProvider.set(cacheKey, { ...cachedPrices, ...tokenWithPrice }, TOKENS_PRICE_EXPIRY);
    }
    return result;
  }

  private getValidProviders({
    allowedSources,
    notAllowSources,
    chainConfig,
  }: {
    allowedSources?: PriceProvider[];
    notAllowSources?: PriceProvider[];
    chainConfig: ChainData | null;
  }): IPriceProvider[] {
    return Array.from(this.providers.values()).filter((provider) => {
      const isInAllowedSources = allowedSources?.includes(provider.id) ?? true;
      const isInNotAllowedSources = notAllowSources?.includes(provider.id) ?? false;

      const isAllowed = allowedSources ? isInAllowedSources && !isInNotAllowedSources : !isInNotAllowedSources;

      if (provider.requiresChainConfig && !chainConfig) {
        console.error(`Provider ${provider.id} requires chainConfig but none was provided.`);
        return false;
      }

      return isAllowed;
    });
  }

  private updateTokensPrice(fetchedPrices: Record<string, string | null>, finalPrices: Record<string, string | null>): void {
    Object.entries(fetchedPrices).forEach(([token, price]) => {
      if (price !== null) {
        finalPrices[token] = price;
      }
    });
  }
}
