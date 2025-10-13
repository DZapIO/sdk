import { GET } from '../../../../constants/httpMethods';
import { ChainData } from '../../../../types';
import { invoke } from '../../../../utils/axios';
import { isNativeCurrency } from '../../../../utils/tokens';
import { IPriceProvider, priceProviders } from '../../types/IPriceProvider';
import { coingeckoConfig } from './config';

export class CoingeckoPriceProvider implements IPriceProvider {
  public id = priceProviders.coingecko;
  public requiresChainConfig = true;

  private fetchNativePrice = async (chainId: number, chainConfig: ChainData): Promise<number | null> => {
    if (!chainConfig || !chainConfig[chainId].isEnabled) return 0;
    const { coingecko } = chainConfig[chainId];
    if (!coingecko) return 0;
    const response: Record<string, { usd: number }> = await invoke({
      endpoint: coingeckoConfig.urls.nativeTokenPrice(coingecko?.nativeTokenKey),
      method: GET,
    });

    return response[coingecko?.nativeTokenKey]?.usd || null;
  };

  private fetchERC20Prices = async (chainId: number, addresses: string[], chainConfig: ChainData): Promise<Record<string, string | null>> => {
    if (!addresses.length || !chainConfig || !chainConfig[chainId].isEnabled) return {};

    const { coingecko } = chainConfig[chainId];
    if (!coingecko) return {};

    const requests = addresses.map((address) => invoke({ endpoint: coingeckoConfig.urls.ecr20TokenPrice(address, coingecko.chainKey), method: GET }));

    const responses = await Promise.allSettled(requests);

    return responses.reduce<Record<string, string | null>>((acc, result, index) => {
      const address = addresses[index];
      if (result.status === 'fulfilled') {
        const tokenPrice = result.value[address.toLowerCase()]?.usd;
        acc[address] = tokenPrice === undefined ? null : tokenPrice.toString();
      } else {
        acc[address] = null;
        console.error(`Error fetching data for address ${address}:`, result.reason);
      }
      return acc;
    }, {});
  };

  public fetchPrices = async (chainId: number, tokenAddresses: string[], chainConfig: ChainData) => {
    try {
      const addressesWithoutNativeToken = tokenAddresses.filter((address) => !isNativeCurrency(address, chainConfig));
      const [erc20Prices, nativePrice] = await Promise.all([
        this.fetchERC20Prices(chainId, addressesWithoutNativeToken, chainConfig),
        addressesWithoutNativeToken.length !== tokenAddresses.length ? this.fetchNativePrice(chainId, chainConfig) : undefined,
      ]);
      if (chainConfig[chainId].isEnabled && nativePrice) {
        erc20Prices[chainConfig[chainId].nativeToken.contract] = nativePrice.toString();
      }

      return erc20Prices;
    } catch (e) {
      return {};
    }
  };
}
