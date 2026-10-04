import { TokenInfo, TokenResponse } from '../../src/types';
import { arbitrumOne, arbitrumUsdc, arbitrumWeth } from './realWorld';

export { arbitrumOne, arbitrumUsdc, arbitrumWeth, sampleAccounts, permit2, LIVE_TEST_TIMEOUT_MS } from './realWorld';

export const mockTokenInfo = (overrides: Partial<TokenInfo> = {}): TokenInfo => ({
  contract: arbitrumUsdc.address,
  name: arbitrumUsdc.name,
  symbol: arbitrumUsdc.symbol,
  decimals: arbitrumUsdc.decimals,
  balance: '1000000',
  balanceInUsd: 1,
  price: '1',
  logo: '',
  chainId: arbitrumOne.chainId,
  ...overrides,
});

export const mockTokenResponse = (): TokenResponse => ({
  [arbitrumUsdc.address]: mockTokenInfo(),
  [arbitrumWeth.address]: mockTokenInfo({
    contract: arbitrumWeth.address,
    symbol: arbitrumWeth.symbol,
    decimals: arbitrumWeth.decimals,
    balanceInUsd: 2,
    price: '2000',
  }),
});
