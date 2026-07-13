import { PriceService } from '../../../../src/service/price';
import { priceProviders } from '../../../../src/service/price/types/IPriceProvider';
import { CacheProvider } from '../../../../src/service/cache/cacheProvider';
import { mockChainConfig } from '../../../fixtures/chainConfig';

describe('service/price/priceService', () => {
  beforeEach(() => {
    CacheProvider.flush();
  });

  it('returns empty object for empty token list', async () => {
    const service = new PriceService();
    const result = await service.getPrices({
      chainId: 42161,
      tokenAddresses: [],
      chainConfig: mockChainConfig,
    });
    expect(result).toEqual({});
  });

  it('fetches prices from providers and caches results', async () => {
    const service = new PriceService();
    const providers = (service as any).providers as Map<string, { fetchPrices: jest.Mock; id: string; requiresChainConfig: boolean }>;
    const dzapProvider = providers.get(priceProviders.dZap)!;
    dzapProvider.fetchPrices = jest.fn().mockResolvedValue({
      '0xaf88d065e77c8cC2239327C5EDb3A432268e5831': '1.00',
    });

    const result = await service.getPrices({
      chainId: 42161,
      tokenAddresses: ['0xaf88d065e77c8cC2239327C5EDb3A432268e5831'],
      chainConfig: mockChainConfig,
    });

    expect(dzapProvider.fetchPrices).toHaveBeenCalled();
    expect(result['0xaf88d065e77c8cC2239327C5EDb3A432268e5831']).toBe('1.00');
  });

  it('respects notAllowSources filter', async () => {
    const service = new PriceService();
    const providers = (service as any).providers as Map<string, { fetchPrices: jest.Mock; id: string; requiresChainConfig: boolean }>;
    const dzapProvider = providers.get(priceProviders.dZap)!;
    dzapProvider.fetchPrices = jest.fn();

    await service.getPrices({
      chainId: 42161,
      tokenAddresses: ['0xaf88d065e77c8cC2239327C5EDb3A432268e5831'],
      chainConfig: mockChainConfig,
      notAllowSources: [priceProviders.dZap],
    });

    expect(dzapProvider.fetchPrices).not.toHaveBeenCalled();
  });
});
