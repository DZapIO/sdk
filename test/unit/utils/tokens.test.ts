import { zeroAddress } from 'viem';
import { priceProviders } from '../../../src/service/price/types/IPriceProvider';
import {
  formatToken,
  getChecksumAddress,
  isNativeCurrency,
  isNonEVMChain,
  sortByBalanceInUsd,
  updateTokenListPrices,
} from '../../../src/utils/tokens';
import { mockChainConfig } from '../../fixtures/chainConfig';
import { mockTokenInfo, mockTokenResponse } from '../../fixtures/tokens';

describe('utils/tokens', () => {
  it('isNativeCurrency detects native token contract', () => {
    expect(isNativeCurrency(zeroAddress, mockChainConfig)).toBe(true);
    expect(isNativeCurrency('0xaf88d065e77c8cC2239327C5EDb3A432268e5831', mockChainConfig)).toBe(false);
    expect(isNativeCurrency(zeroAddress, null as any)).toBe(false);
  });

  it('sortByBalanceInUsd orders tokens with balance first', () => {
    const entries: [string, ReturnType<typeof mockTokenInfo>][] = [
      ['a', mockTokenInfo({ balanceInUsd: null })],
      ['b', mockTokenInfo({ balanceInUsd: 5 })],
      ['c', mockTokenInfo({ balanceInUsd: 10 })],
    ];
    const sorted = sortByBalanceInUsd(entries);
    expect(Object.keys(sorted)).toEqual(['c', 'b', 'a']);
  });

  it('isNonEVMChain returns true for non-evm chains', () => {
    expect(isNonEVMChain(7565164, mockChainConfig)).toBe(true);
    expect(isNonEVMChain(42161, mockChainConfig)).toBe(false);
  });

  it('getChecksumAddress returns checksummed address', () => {
    expect(getChecksumAddress('0xaf88d065e77c8cc2239327c5edb3a432268e5831')).toBe('0xaf88d065e77c8cC2239327C5EDb3A432268e5831');
  });

  it('formatToken returns native address for native tokens', () => {
    expect(formatToken('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', zeroAddress)).toBe(zeroAddress);
    expect(formatToken('0xaf88d065e77c8cc2239327c5edb3a432268e5831')).toBe('0xaf88d065e77c8cC2239327C5EDb3A432268e5831');
    expect(formatToken('not-an-address')).toBe('not-an-address');
  });

  it('updateTokenListPrices returns tokens unchanged when prices already exist', async () => {
    const tokens = mockTokenResponse();
    const priceService = { getPrices: jest.fn() };

    const result = await updateTokenListPrices(tokens, 42161, mockChainConfig, priceService as any);

    expect(result).toEqual(tokens);
    expect(priceService.getPrices).not.toHaveBeenCalled();
  });

  it('updateTokenListPrices fetches missing prices and recalculates balanceInUsd', async () => {
    const token = mockTokenInfo({ price: '0', balance: '2000000', balanceInUsd: null });
    const tokens = { [token.contract]: token };
    const priceService = {
      getPrices: jest.fn().mockResolvedValue({ [token.contract]: '1.5' }),
    };

    const result = await updateTokenListPrices(tokens, 42161, mockChainConfig, priceService as any);

    expect(priceService.getPrices).toHaveBeenCalledWith({
      chainId: 42161,
      tokenAddresses: [token.contract],
      chainConfig: mockChainConfig,
      notAllowSources: [priceProviders.dZap],
    });
    expect(result[token.contract].price).toBe('1.5');
    expect(result[token.contract].balanceInUsd).toBe(3);
  });

  it('updateTokenListPrices leaves balanceInUsd null when price is unavailable', async () => {
    const token = mockTokenInfo({ price: '0', balance: '1000000', balanceInUsd: null });
    const tokens = { [token.contract]: token };
    const priceService = {
      getPrices: jest.fn().mockResolvedValue({}),
    };

    const result = await updateTokenListPrices(tokens, 42161, mockChainConfig, priceService as any);

    expect(result[token.contract].price).toBe('0');
    expect(result[token.contract].balanceInUsd).toBeNull();
  });

  it('updateTokenListPrices returns original tokens when price fetch fails', async () => {
    const token = mockTokenInfo({ price: '0', balance: '1000000', balanceInUsd: null });
    const tokens = { [token.contract]: token };
    const priceService = {
      getPrices: jest.fn().mockRejectedValue(new Error('price api down')),
    };

    const result = await updateTokenListPrices(tokens, 42161, mockChainConfig, priceService as any);

    expect(result).toEqual(tokens);
  });
});
