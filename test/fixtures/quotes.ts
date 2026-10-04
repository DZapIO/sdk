import { Fee, TradeQuote, TradeQuotesResponse } from '../../src/types';

const feeDetail = (overrides: Partial<import('../../src/types').FeeDetails> = {}) => ({
  address: '0x0',
  decimals: 18,
  chainId: 42161,
  symbol: 'ETH',
  amount: '0',
  amountUSD: '0',
  included: false,
  ...overrides,
});

export const emptyFee = (): Fee => ({
  gasFee: [],
  providerFee: [],
  protocolFee: [],
});

export { feeDetail };

export const mockTradeQuote = (overrides: Partial<TradeQuote> = {}): TradeQuote => ({
  providerDetails: { id: 'test', name: 'Test', icon: '' },
  srcAmount: '1000000',
  srcAmountUSD: '1.00000',
  destAmount: '990000',
  destAmountUSD: '0.99000',
  minDestAmount: '980000',
  swapPerUnit: '0.99',
  srcToken: {
    address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    chainId: 42161,
    decimals: 6,
    symbol: 'USDC',
    logo: '',
  },
  destToken: {
    address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    chainId: 42161,
    decimals: 18,
    symbol: 'WETH',
    logo: '',
  },
  fee: emptyFee(),
  priceImpactPercent: '0',
  duration: '30',
  gasless: false,
  steps: [],
  path: [],
  ...overrides,
});

export const mockTradeQuotesResponse = (): TradeQuotesResponse => ({
  '42161_0xaf88-42161_0x82aF': {
    recommendedSource: 'provider1',
    bestReturnSource: 'provider1',
    tokensWithoutPrice: {},
    quoteRates: {
      provider1: mockTradeQuote(),
    },
  },
});
