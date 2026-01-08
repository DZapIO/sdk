import { fetchTokenPrice } from '../../../../api';
import { IPriceProvider, priceProviders } from '../../types/IPriceProvider';
import { logger } from '../../../../utils/logger';

export class DZapPriceProvider implements IPriceProvider {
  public id = priceProviders.dZap;
  public requiresChainConfig = false;

  public fetchPrices = async (chainId: number, tokenAddresses: string[]): Promise<Record<string, string | null>> => {
    try {
      const tokenPrices = await fetchTokenPrice(tokenAddresses, chainId);
      return tokenPrices;
    } catch (e: unknown) {
      logger.error('Failed to fetch token price from DZap API', {
        service: 'DZapPriceProvider',
        method: 'fetchPrices',
        chainId,
        error: e,
      });
      return {};
    }
  };
}
