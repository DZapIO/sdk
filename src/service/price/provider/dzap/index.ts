import { fetchTokenPrice } from '../../../../api';
import { IPriceProvider, priceProviders } from '../../types/IPriceProvider';

export class DZapPriceProvider implements IPriceProvider {
  public id = priceProviders.dZap;
  public requiresChainConfig = false;

  public fetchPrices = async (chainId: number, tokenAddresses: string[]): Promise<Record<string, string | null>> => {
    try {
      const tokens = tokenAddresses.join(',');
      const tokenPrices = await fetchTokenPrice(tokens, chainId);
      return tokenPrices;
    } catch (e) {
      console.error('Failed to fetch token price', e);
      return {};
    }
  };
}
