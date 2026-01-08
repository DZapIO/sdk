import { formatUnits } from 'viem';
import { fetchAllTokens, fetchBalances, fetchTokenDetails } from '../../api';
import { ChainData, TokenInfo, TokenResponse } from '../../types';
import { PriceService } from '../price';
import { priceProviders } from '../price/types/IPriceProvider';
import { logger } from '../../utils/logger';

/**
 * TokenService handles all token-related operations including fetching token data, balances, prices, and approvals.
 */
export class TokenService {
  constructor(
    private priceService: PriceService,
    private getChainConfig: () => Promise<ChainData>,
  ) {}

  /**
   * Fetches all available tokens for a specific blockchain with optional account-specific data.
   * Token data includes metadata, prices, and optionally user balances.
   * Prices are automatically updated using the integrated price service for accurate market data.
   *
   * @param chainId - The blockchain network ID to fetch tokens for
   * @param source - Optional source identifier for filtered token lists
   * @param account - Optional wallet address to include balance information
   * @returns Promise resolving to token list with metadata and updated pricing information
   *
   * @example
   * ```typescript
   * // Get all tokens on Ethereum
   * const ethTokens = await client.tokens.getAll(1);
   *
   * // Get tokens with user balances
   * const tokensWithBalances = await client.tokens.getAll(1, undefined, '0x...');
   *
   * // Get tokens from specific source
   * const curatedTokens = await client.tokens.getAll(1, 'coingecko');
   * ```
   */
  public async getAll(chainId: number, source?: string, account?: string): Promise<TokenResponse> {
    try {
      const tokens = await fetchAllTokens(chainId, source, account);
      const chainConfig = await this.getChainConfig();

      if (!chainConfig) return tokens;

      return await this.updateTokenListPrices(tokens, chainId, chainConfig);
    } catch (error: unknown) {
      logger.error('Error fetching or updating tokens', { service: 'TokenService', method: 'getAll', chainId, error });
      return {};
    }
  }

  /**
   * Fetches comprehensive details for a specific token on a blockchain network.
   * Can include token metadata, current market price, and user-specific balance information.
   *
   * @param tokenAddress - The contract address of the token to fetch details for
   * @param chainId - The blockchain network ID where the token exists
   * @param account - Optional wallet address to include balance information
   * @param includeBalance - Optional flag to include user balance data
   * @param includePrice - Optional flag to include current market price
   * @returns Promise resolving to detailed token information object
   *
   * @example
   * ```typescript
   * // Get basic token details for single token
   * const tokenInfo = await client.tokens.getDetails(
   *   '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
   *   1 // Ethereum
   * );
   *
   * // Get token details with balance and price
   * const fullTokenInfo = await client.tokens.getDetails(
   *   '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
   *   1,
   *   '0x...', // user address
   *   true, // include balance
   *   true  // include price
   * );
   *
   * // Get details for multiple tokens
   * const multipleTokens = await client.tokens.getDetails(
   *   ['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'],
   *   1,
   *   '0x...', // user address
   *   true, // include balance
   *   true  // include price
   * );
   * ```
   */
  public async getDetails(
    tokenAddress: string,
    chainId: number,
    account?: string,
    includeBalance?: boolean,
    includePrice?: boolean,
  ): Promise<TokenInfo>;
  public async getDetails(
    tokenAddress: string[],
    chainId: number,
    account?: string,
    includeBalance?: boolean,
    includePrice?: boolean,
  ): Promise<Record<string, TokenInfo>>;
  public async getDetails(
    tokenAddress: string[] | string,
    chainId: number,
    account?: string,
    includeBalance?: boolean,
    includePrice?: boolean,
  ): Promise<TokenInfo | Record<string, TokenInfo>> {
    return await fetchTokenDetails(tokenAddress, chainId, account, includeBalance, includePrice);
  }

  /**
   * Fetches current market prices for multiple tokens on a specific blockchain.
   * Utilizes integrated price providers to ensure accurate and up-to-date pricing information.
   *
   * @param tokenAddresses - Array of token contract addresses to fetch prices for
   * @param chainId - The blockchain network ID where the tokens exist
   * @returns Promise resolving to mapping of token addresses to their current prices (or null if unavailable)
   *
   * @example
   * ```typescript
   * const prices = await client.tokens.getPrices([
   *   '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
   *   '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' // WETH
   * ], 1);
   *
   * console.log('USDC price:', prices['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48']);
   * console.log('WETH price:', prices['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2']);
   * ```
   */
  public async getPrices(tokenAddresses: string[], chainId: number): Promise<Record<string, string | null>> {
    const chainConfig = await this.getChainConfig();
    return await this.priceService.getPrices({ chainId, tokenAddresses, chainConfig });
  }

  /**
   * Fetches all token balances for a specific account on a given blockchain network.
   * This method retrieves the complete portfolio of tokens held by the specified wallet address,
   * including token metadata and current balance amounts for each token.
   *
   * @param chainId - The blockchain network ID to fetch balances from (e.g., 1 for Ethereum, 42161 for Arbitrum)
   * @param account - The wallet address to fetch token balances for
   * @returns Promise resolving to an object where each key is a token contract address and each value contains token balance and metadata (e.g., name, symbol, decimals).
   *
   * @example
   * ```typescript
   * // Get all token balances for a wallet on Base
   * const balances = await client.tokens.getBalances(8453, '0x...');
   *
   * // Process the balances
   * Object.entries(balances).forEach(([contractAddress, token]) => {
   *   console.log(`${token.symbol}: ${token.balance}`);
   *   console.log(`Contract: ${contractAddress}`);
   * });
   *
   * // Get specific token balance
   * const usdcBalance = balances['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'];
   * console.log(`USDC Balance: ${usdcBalance.balance}`);
   * ```
   */
  public async getBalances(chainId: number, account: string): Promise<TokenResponse> {
    const balanceData = await fetchBalances(chainId, account);
    return balanceData.result;
  }

  /**
   * Sorts token entries by their USD balance value
   * @param tokenEntries - Array of token entries to sort
   * @returns Sorted token response object
   */
  private sortByBalanceInUsd(tokenEntries: [string, TokenInfo][]): TokenResponse {
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
  }

  /**
   * Updates token list with current market prices
   * @param tokens - Token response object to update
   * @param chainId - Chain ID for the tokens
   * @param chainConfig - Chain configuration data
   * @returns Promise resolving to updated token response with prices
   */
  private async updateTokenListPrices(tokens: TokenResponse, chainId: number, chainConfig: ChainData): Promise<TokenResponse> {
    try {
      const tokensWithoutPrice = Object.values(tokens)
        .filter(({ price, balance }) => (!price || price === '0') && balance !== '0')
        .map(({ contract }) => contract);

      if (tokensWithoutPrice.length === 0) return tokens;

      const fetchedPrices = await this.priceService.getPrices({
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
      return this.sortByBalanceInUsd(Object.entries(tokens));
    } catch (error: unknown) {
      logger.error('Error fetching token prices', { service: 'TokenService', method: 'updateTokenListPrices', chainId, error });
      return tokens;
    }
  }
}
