import { updateQuotes } from '../../../src/utils/updateQuotes';
import { mockTradeQuotesResponse } from '../../fixtures/quotes';
import { mockChainConfig } from '../../fixtures/chainConfig';

describe('utils/updateQuotes', () => {
  it('returns quotes unchanged when no tokens need pricing', async () => {
    const quotes = mockTradeQuotesResponse();
    const priceService = { getPrices: jest.fn() };
    const request = { fromChain: 42161, account: '0x0', data: [] };

    const result = await updateQuotes(quotes, request as any, priceService as any, mockChainConfig);
    expect(result).toEqual(quotes);
    expect(priceService.getPrices).not.toHaveBeenCalled();
  });

  it('fetches prices and enriches quotes when tokensWithoutPrice present', async () => {
    const quotes = mockTradeQuotesResponse();
    const pairKey = Object.keys(quotes)[0];
    quotes[pairKey].tokensWithoutPrice = { 42161: ['0xaf88d065e77c8cC2239327C5EDb3A432268e5831'] };
    quotes[pairKey].quoteRates!.provider1.srcAmountUSD = '0';
    quotes[pairKey].quoteRates!.provider1.destAmountUSD = '0';

    const priceService = {
      getPrices: jest.fn().mockResolvedValue({
        '0xaf88d065e77c8cC2239327C5EDb3A432268e5831': '1',
      }),
    };
    const request = { fromChain: 42161, account: '0x0', data: [] };

    const result = await updateQuotes(quotes, request as any, priceService as any, mockChainConfig);
    expect(priceService.getPrices).toHaveBeenCalled();
    expect(result[pairKey].quoteRates!.provider1.srcAmountUSD).not.toBe('0');
  });
});
