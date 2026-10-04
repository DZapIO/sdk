import DZapClient from '../../../src/dZapClient';
import { TradeBuildTxnRequest, TradeQuotesRequest } from '../../../src/types';
import { arbitrumUsdc, arbitrumWeth, sampleAccounts } from '../../fixtures/realWorld';
import { BUILD_API_DELAY_MS, delay, withRateLimitRetry } from '../../helpers/rateLimitRetry';

const ARBITRUM = 42161;
const BASE = 8453;

const crossChainQuoteRequest = (): TradeQuotesRequest => ({
  fromChain: ARBITRUM,
  account: sampleAccounts.testWallet,
  data: [
    {
      amount: '374980',
      destDecimals: 18,
      destToken: '0x4200000000000000000000000000000000000006',
      slippage: 1,
      srcDecimals: arbitrumUsdc.decimals,
      srcToken: arbitrumUsdc.address,
      toChain: BASE,
    },
  ],
});

const sameChainQuoteRequest = (): TradeQuotesRequest => ({
  fromChain: ARBITRUM,
  account: sampleAccounts.testWallet,
  data: [
    {
      amount: '374980',
      destDecimals: arbitrumWeth.decimals,
      destToken: arbitrumWeth.address,
      slippage: 1,
      srcDecimals: arbitrumUsdc.decimals,
      srcToken: arbitrumUsdc.address,
      toChain: ARBITRUM,
    },
  ],
});

const buildRequestFromQuote = (quoteRequest: TradeQuotesRequest, protocol: string): TradeBuildTxnRequest => ({
  fromChain: quoteRequest.fromChain,
  sender: sampleAccounts.testWallet,
  refundee: sampleAccounts.testWallet,
  gasless: false,
  disableEstimation: true,
  data: quoteRequest.data.map((item) => ({
    amount: item.amount,
    srcToken: item.srcToken,
    srcDecimals: item.srcDecimals,
    destToken: item.destToken,
    destDecimals: item.destDecimals,
    protocol,
    slippage: item.slippage,
    recipient: sampleAccounts.testWallet,
    toChain: item.toChain,
  })),
});

const recommendedProtocol = async (quoteRequest: TradeQuotesRequest): Promise<string> => {
  const quotes = await withRateLimitRetry(() => DZapClient.getInstance().getTradeQuotes(quoteRequest));
  const pairKey = Object.keys(quotes)[0];
  expect(pairKey).toBeDefined();
  const protocol = quotes[pairKey].recommendedSource;
  expect(protocol).toBeTruthy();
  return protocol;
};

describe('DZapClient - buildTxn', () => {
  let client: DZapClient;

  beforeAll(() => {
    client = DZapClient.getInstance();
  });

  it('should build a cross-chain transaction', async () => {
    const quoteRequest = crossChainQuoteRequest();
    const protocol = await recommendedProtocol(quoteRequest);
    await delay(BUILD_API_DELAY_MS);

    const result = await withRateLimitRetry(() => client.buildTradeTxn(buildRequestFromQuote(quoteRequest, protocol)));
    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.to).toBeDefined();
    expect(result.from).toBeDefined();
    expect(result.chainId).toBeDefined();
  }, 120_000);

  it('should build a same-chain transaction', async () => {
    await delay(BUILD_API_DELAY_MS);
    const quoteRequest = sameChainQuoteRequest();
    const protocol = await recommendedProtocol(quoteRequest);
    await delay(BUILD_API_DELAY_MS);

    const result = await withRateLimitRetry(() => client.buildTradeTxn(buildRequestFromQuote(quoteRequest, protocol)));
    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.to).toBeDefined();
    expect(result.from).toBeDefined();
    expect(result.chainId).toBeDefined();
  }, 120_000);
});
