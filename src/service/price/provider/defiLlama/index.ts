import { GET } from '../../../../constants/httpMethods';
import { ChainData } from '../../../../types';
import { isNativeCurrency } from '../../../../utils';
import { invoke } from '../../../../utils/axios';
import { IPriceProvider, priceProviders } from '../../types/IPriceProvider';
import { defiLlamaConfig } from './config';
import { DefiLlamaResponse } from './types';

export class DefiLlamaPriceProvider implements IPriceProvider {
  public id = priceProviders.defiLlama;
  public requiresChainConfig = true;

  private preProcess(chainId: number, tokenAddresses: string[], chainConfig: ChainData): string[] {
    const chainInfo = chainConfig[chainId];
    if (!chainInfo.isEnabled || !chainInfo?.name) {
      return [];
    }
    const { name, defiLlama } = chainInfo;

    return tokenAddresses.map((address) => {
      if (defiLlama?.chainKey) {
        if (isNativeCurrency(address, chainConfig)) {
          return `${defiLlama.chainKey}:${defiLlama.nativeTokenKey}`;
        }
        return `${defiLlama.chainKey}:${address}`;
      }
      return `${name}:${address}`;
    });
  }

  private postProcess = (chainId: number, tokenAddresses: string[], chainConfig: ChainData, respose: DefiLlamaResponse) => {
    const { name } = chainConfig[chainId];
    if (!name) return {};
    return tokenAddresses.reduce<Record<string, string | null>>((acc, address) => {
      const token = respose.coins[`${name}:${address}`];
      if (!token) {
        acc[address] = null;
        return acc;
      }
      acc[address] = token.price.toString();
      return acc;
    }, {});
  };

  public fetchPrices = async (chainId: number, tokenAddresses: string[], chainConfig: ChainData): Promise<Record<string, string | null>> => {
    try {
      const requestTokens = this.preProcess(chainId, tokenAddresses, chainConfig);
      if (!requestTokens.length) return {};
      const response: DefiLlamaResponse = await invoke({
        endpoint: defiLlamaConfig.url(requestTokens),
        method: GET,
      });
      return this.postProcess(chainId, tokenAddresses, chainConfig, response);
    } catch (e) {
      return {};
    }
  };
}
