import {
  calculateAmountUSD,
  calculateNetAmountUsd,
  calculateNetGasFee,
  calculateNetGasFeeUsd,
  updateFee,
  updatePath,
} from '../../../src/utils/amount';
import { mockTradeQuote, feeDetail, emptyFee } from '../../fixtures/quotes';

describe('utils/amount', () => {
  it('calculateAmountUSD converts wei to USD', () => {
    expect(calculateAmountUSD('1000000', 6, '1')).toBe('1.00000');
    expect(calculateAmountUSD('1000000', 0, '1')).toBe('0');
  });

  it('calculateNetGasFeeUsd sums non-included gas fees', () => {
    const quote = mockTradeQuote({
      fee: {
        gasFee: [feeDetail({ included: false, amountUSD: '0.5', amount: '100' }), feeDetail({ included: true, amountUSD: '1', amount: '200' })],
        providerFee: [],
        protocolFee: [],
      },
    });
    expect(calculateNetGasFeeUsd(quote)).toBe('0.50000');
  });

  it('calculateNetAmountUsd subtracts fees from dest amount', () => {
    const quote = mockTradeQuote({
      destAmountUSD: '10.00000',
      fee: {
        gasFee: [feeDetail({ included: false, amountUSD: '1.00000', amount: '100' })],
        providerFee: [feeDetail({ included: false, amountUSD: '0.50000', amount: '50' })],
        protocolFee: [],
      },
    });
    expect(calculateNetAmountUsd(quote)).toBe('8.50000');
  });

  it('calculateNetGasFee sums non-included gas amounts', () => {
    const quote = mockTradeQuote({
      fee: {
        gasFee: [feeDetail({ included: false, amount: '100' }), feeDetail({ included: true, amount: '200' })],
        providerFee: [],
        protocolFee: [],
      },
    });
    expect(calculateNetGasFee(quote)).toBe(BigInt(100));
  });

  it('updateFee fills missing amountUSD from token prices', () => {
    const quote = mockTradeQuote();
    const { fee, isUpdated } = updateFee(quote.fee, {
      42161: { '0xaf88d065e77c8cC2239327C5EDb3A432268e5831': '1' },
    });
    expect(isUpdated).toBe(false);
    expect(fee.gasFee).toEqual([]);
  });

  it('updatePath propagates fee updates to path items', () => {
    const baseQuote = mockTradeQuote();
    const quote = mockTradeQuote({
      path: [
        {
          type: 'swap',
          exchange: baseQuote.providerDetails,
          srcToken: baseQuote.srcToken,
          srcAmount: '100',
          srcAmountUSD: '1',
          destToken: baseQuote.destToken,
          destAmount: '99',
          destAmountUSD: '0.99',
          fee: emptyFee(),
        },
      ],
    });
    const path = updatePath(quote, {});
    expect(path).toHaveLength(1);
    expect(path[0].srcAmountUSD).toBe(quote.srcAmountUSD);
  });
});
