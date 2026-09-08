import {
  fetchAllSupportedChains,
  fetchAllTokens,
  fetchBalances,
  fetchMultiTxStatus,
  fetchStatus,
  fetchTokenDetails,
  fetchTokenPrice,
  fetchTradeQuotes,
  fetchZapChains,
  fetchZapPoolDetails,
  fetchZapPools,
  fetchZapPositions,
  fetchZapProviders,
} from '../../../src/api';
import { HexString, TradeQuotesRequest } from '../../../src/types';
import { arbitrumOne, arbitrumUsdc, arbitrumWeth, LIVE_TEST_TIMEOUT_MS, sampleAccounts } from '../../fixtures/tokens';
import {
  expectBalancesResponse,
  expectSupportedChainsResponse,
  expectTokenInfo,
  expectTokenPriceResponse,
  expectTokenResponse,
  expectTradeQuotesResponse,
  expectTradeStatusResponse,
  expectZapApiResponse,
  expectZapChains,
  expectZapPoolDetails,
  expectZapPoolsResponse,
  expectZapPositionsResponse,
  expectZapProviders,
} from '../../helpers/validators/apiResponses';
import { delay, TRADE_API_DELAY_MS, withRateLimitRetry, ZAP_API_DELAY_MS } from '../../helpers/rateLimitRetry';

const tradeQuoteRequest = (): TradeQuotesRequest => ({
  fromChain: arbitrumOne.chainId,
  account: sampleAccounts.testWallet,
  data: [
    {
      amount: '374980',
      destDecimals: arbitrumWeth.decimals,
      destToken: arbitrumWeth.address,
      slippage: 1,
      srcDecimals: arbitrumUsdc.decimals,
      srcToken: arbitrumUsdc.address,
      toChain: arbitrumOne.chainId,
    },
  ],
});

describe('api/index (live)', () => {
  jest.setTimeout(LIVE_TEST_TIMEOUT_MS * 4);

  it(
    'trade API responses match their declared types',
    async () => {
      const chains = await withRateLimitRetry('fetchAllSupportedChains', fetchAllSupportedChains);
      expectSupportedChainsResponse(chains);
      expect(chains.some((chain) => chain.chainId === arbitrumOne.chainId)).toBe(true);

      await delay(TRADE_API_DELAY_MS);
      const tokens = await withRateLimitRetry('fetchAllTokens', () => fetchAllTokens(arbitrumOne.chainId, 'dzap', sampleAccounts.testWallet));
      expectTokenResponse(tokens);
      expect(tokens[arbitrumUsdc.address]).toBeDefined();

      await delay(TRADE_API_DELAY_MS);
      const token = await withRateLimitRetry('fetchTokenDetails', () =>
        fetchTokenDetails(arbitrumUsdc.address, arbitrumOne.chainId, sampleAccounts.testWallet, true, true),
      );
      expectTokenInfo(token);
      expect(token.contract).toBe(arbitrumUsdc.address);

      await delay(TRADE_API_DELAY_MS);
      const prices = await withRateLimitRetry('fetchTokenPrice', () =>
        fetchTokenPrice(`${arbitrumUsdc.address},${arbitrumWeth.address}`, arbitrumOne.chainId),
      );
      expectTokenPriceResponse(prices);
      expect(prices[arbitrumUsdc.address]).toBeDefined();

      await delay(TRADE_API_DELAY_MS);
      const quotes = await withRateLimitRetry('fetchTradeQuotes', () => fetchTradeQuotes(tradeQuoteRequest()));
      expectTradeQuotesResponse(quotes);
      expect(Object.keys(quotes).length).toBeGreaterThan(0);

      await delay(TRADE_API_DELAY_MS);
      const status = await withRateLimitRetry('fetchStatus', () =>
        fetchStatus({
          txHash: '0x3c48cb39902c215e5b055235ed2d11b0190e3f4b1f73566862359e334a96b166',
          chainId: 8453,
        }),
      );
      expectTradeStatusResponse(status);

      await delay(TRADE_API_DELAY_MS);
      const statuses = await withRateLimitRetry('fetchMultiTxStatus', () =>
        fetchMultiTxStatus({
          txHashes: '0x3c48cb39902c215e5b055235ed2d11b0190e3f4b1f73566862359e334a96b166',
          chainIds: '8453',
        }),
      );
      expect(Array.isArray(statuses)).toBe(true);
      statuses.forEach((entry, index) => expectTradeStatusResponse(entry, `statuses[${index}]`));

      await delay(TRADE_API_DELAY_MS);
      const balances = await withRateLimitRetry('fetchBalances', () => fetchBalances(arbitrumOne.chainId, sampleAccounts.testWallet));
      expectBalancesResponse(balances);
    },
    LIVE_TEST_TIMEOUT_MS * 6,
  );

  it('zap API responses match their declared types', async () => {
    const chains = await fetchZapChains();
    expectZapApiResponse(chains, expectZapChains);
    expect(chains.data['42161']).toBeDefined();

    await delay(ZAP_API_DELAY_MS);
    const providers = await fetchZapProviders();
    expectZapApiResponse(providers, expectZapProviders);
    expect(providers.data.uniswap).toBeDefined();

    await delay(ZAP_API_DELAY_MS);
    const pools = await fetchZapPools({
      chainId: arbitrumOne.chainId,
      provider: 'uniswap',
      limit: 5,
      offset: 0,
    });
    const validatedPools = expectZapApiResponse(pools, expectZapPoolsResponse);
    expect(validatedPools.data.pools.length).toBeGreaterThan(0);

    const poolAddress = validatedPools.data.pools[0]?.address as HexString;
    expect(poolAddress).toBeDefined();

    await delay(ZAP_API_DELAY_MS);
    const poolDetails = await fetchZapPoolDetails({
      address: poolAddress,
      chainId: arbitrumOne.chainId,
      provider: 'uniswap',
    });
    expectZapApiResponse(poolDetails, expectZapPoolDetails);

    await delay(ZAP_API_DELAY_MS);
    const positions = await fetchZapPositions({
      account: sampleAccounts.testWallet,
      chainId: arbitrumOne.chainId,
      provider: 'uniswap',
    });
    expectZapApiResponse(positions, expectZapPositionsResponse);
  });
});
