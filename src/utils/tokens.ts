import { PriceService } from 'src/service/price';
import { priceProviders } from 'src/service/price/types/IPriceProvider';
import { ChainData, HexString, TokenInfo, TokenResponse } from 'src/types';
import { formatUnits, isAddress, zeroAddress } from 'viem';
import { getChecksumAddress } from '.';

export const isNativeCurrency = (address: string, chainConfig: ChainData) => {
  if (!chainConfig) return false;
  return Object.values(chainConfig).some((chain) => chain.isEnabled && chain.nativeToken.contract === address);
};

export const sortByBalanceInUsd = (tokenEntries: [string, TokenInfo][]): TokenResponse => {
  const { withBalanceInUsd, withoutBalanceInUsd } = tokenEntries.reduce(
    (acc, [key, token]) => {
      if (token.balanceInUsd !== null) {
        acc.withBalanceInUsd.push([key, token]);
      } else {
        acc.withoutBalanceInUsd.push([key, token]);
      }
      return acc;
    },
    { withBalanceInUsd: [] as [string, TokenInfo][], withoutBalanceInUsd: [] as [string, TokenInfo][] },
  );

  withBalanceInUsd.sort((a, b) => b[1].balanceInUsd! - a[1].balanceInUsd!);

  return Object.fromEntries([...withBalanceInUsd, ...withoutBalanceInUsd]);
};

export const updateTokenListPrices = async (
  tokens: TokenResponse,
  chainId: number,
  chainConfig: ChainData,
  priceService: PriceService,
): Promise<TokenResponse> => {
  try {
    const tokensWithoutPrice = Object.values(tokens)
      .filter(({ price, balance }) => (!price || price === '0') && balance !== '0')
      .map(({ contract }) => contract);

    if (tokensWithoutPrice.length === 0) return tokens;

    const fetchedPrices = await priceService.getPrices({
      chainId,
      tokenAddresses: tokensWithoutPrice,
      chainConfig,
      notAllowSources: [priceProviders.dZap],
    });

    tokensWithoutPrice.forEach((token) => {
      tokens[token].price = fetchedPrices[token] || tokens[token].price;
      tokens[token].balanceInUsd = fetchedPrices[token]
        ? parseFloat(fetchedPrices[token]) * parseFloat(formatUnits(BigInt(tokens[token].balance), tokens[token].decimals))
        : null;
    });
    return sortByBalanceInUsd(Object.entries(tokens));
  } catch (error) {
    console.error('Error fetching token prices:', error);
    return tokens;
  }
};

export function isNonEVMChain(chainId: number, chainConfig: ChainData) {
  return chainConfig[chainId]?.chainType !== 'evm';
}

export const formatToken = (token: string, chainId: number, chainConfig: ChainData, nativeToken = zeroAddress): string => {
  if (isNonEVMChain(chainId, chainConfig)) {
    return token;
  }
  return isNativeCurrency(token as HexString, chainConfig)
    ? (nativeToken as HexString)
    : isAddress(token)
      ? getChecksumAddress(token as HexString)
      : token;
};
