import DZapClient from '../src/client';
import { QuotesRequest } from '../src/types';

describe('DZapClient - getQuotes', () => {
  let client: DZapClient;

  beforeAll(() => {
    client = DZapClient.getInstance();
  });

  it('should return quotes for a cross-chain swap', async () => {
    const request: QuotesRequest = {
      fromChain: 42161,
      account: '0x99BCEBf44433E901597D9fCb16E799a4847519f6',
      data: [
        {
          amount: '374980',
          destDecimals: 18,
          destToken: '0x4200000000000000000000000000000000000006',
          slippage: 1,
          srcDecimals: 6,
          srcToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
          toChain: 8453,
        },
      ],
      integratorId: 'dzap',
    };

    const quotes = await client.getQuotes(request);
    const quoteKeys = Object.keys(quotes);
    expect(quoteKeys.length).toBeGreaterThan(0);
    const firstQuote = quotes[quoteKeys[0]];
    expect(firstQuote).toBeDefined();
    expect(firstQuote.quoteRates).toBeDefined();
    const quoteRatesKeys = Object.keys(firstQuote.quoteRates!);
    expect(quoteRatesKeys.length).toBeGreaterThan(0);
  });

  it('should return quotes for a same-chain swap', async () => {
    const request: QuotesRequest = {
      fromChain: 42161,
      account: '0x99BCEBf44433E901597D9fCb16E799a4847519f6',
      data: [
        {
          amount: '374980',
          destDecimals: 18,
          destToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
          slippage: 1,
          srcDecimals: 6,
          srcToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
          toChain: 42161, // Same chain
        },
      ],
      integratorId: 'dzap',
    };

    const quotes = await client.getQuotes(request);
    const quoteKeys = Object.keys(quotes);
    expect(quoteKeys.length).toBeGreaterThan(0);
    const firstQuote = quotes[quoteKeys[0]];
    expect(firstQuote).toBeDefined();
    expect(firstQuote.quoteRates).toBeDefined();
    const quoteRatesKeys = Object.keys(firstQuote.quoteRates!);
    expect(quoteRatesKeys.length).toBeGreaterThan(0);
  });
});
