import { createPublicClient, fallback, http, type PublicClient } from 'viem';

import { TradeApiClient } from '../../api';
import { viemChainsById } from '../../chains';
import { config } from '../../config';
import { RPC_BATCHING_WAIT_TIME, RPC_RETRY_DELAY } from '../../constants/rpc';
import type { Chain, ChainData } from '../../types';

const publicClientRpcConfig = { batch: { wait: RPC_BATCHING_WAIT_TIME }, retryDelay: RPC_RETRY_DELAY };

/**
 * ChainsService handles all chain configuration, chain-related operations, and blockchain client creation.
 * This service centralizes all chain-related functionality including:
 * - Chain configuration fetching and caching
 * - Public client creation for blockchain interactions
 * - RPC URL management
 * - Viem chain utilities
 */
export class ChainsService {
  private static chainConfig: ChainData | null = null;

  /**
   * Fetches all blockchain networks supported by the DZap protocol.
   * Returns comprehensive configuration data including contract addresses, features, and network parameters.
   *
   * @returns Promise resolving to mapping of chain IDs to complete chain configuration objects
   *
   * @example
   * ```typescript
   * const chains = await client.chains.getSupportedChains();
   * const chainIds = Object.keys(chains);
   * console.log('Supported chains:', chainIds);
   * ```
   */
  public async getSupportedChains(): Promise<ChainData> {
    return TradeApiClient.fetchAllSupportedChains();
  }

  /**
   * Fetches and caches all supported blockchain configurations by DZap.
   * The chain configuration includes contract addresses, supported features, and network details.
   * Results are cached to improve performance on subsequent calls.
   *
   * @returns Promise resolving to a mapping of chain IDs to their complete chain configuration objects
   *
   * @example
   * ```typescript
   * const chainConfig = await client.chains.getConfig();
   * const ethereumConfig = chainConfig[1]; // Ethereum mainnet config
   * const arbitrumConfig = chainConfig[42161]; // Arbitrum config
   * ```
   */
  public async getConfig(): Promise<ChainData> {
    if (!ChainsService.chainConfig) {
      const data = await TradeApiClient.fetchAllSupportedChains();
      const chains: ChainData = {};
      data.forEach((chain: Chain) => {
        if (!chains[chain.chainId]) {
          chains[chain.chainId] = chain;
        }
      });
      ChainsService.chainConfig = chains;
    }
    return ChainsService.chainConfig;
  }

  /**
   * Creates a public client for blockchain interactions using viem.
   * Automatically uses configured RPC URLs from config if available, otherwise falls back to default.
   *
   * @param chainId - The chain ID to connect to
   * @param rpcUrls - Optional array of RPC URLs to use (overrides config if provided)
   * @returns A configured viem public client
   *
   * @example
   * ```typescript
   * // Use configured RPC URLs from config
   * const client = ChainsService.getPublicClient(1);
   *
   * // Override with custom RPC URLs
   * const customClient = ChainsService.getPublicClient(1, ['https://custom-rpc.com']);
   *
   * // Or via client instance
   * const client = client.chains.getPublicClient(1);
   * ```
   */
  public static getPublicClient(chainId: number, rpcUrls?: string[]): PublicClient {
    const configuredRpcUrls = rpcUrls ?? config.getRpcUrlsByChainId(chainId);
    const hasRpcUrls = configuredRpcUrls && Array.isArray(configuredRpcUrls) && configuredRpcUrls.length > 0;
    const chain = viemChainsById[chainId];

    if (!chain) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    return createPublicClient({
      chain,
      transport: fallback(hasRpcUrls ? configuredRpcUrls.map((rpc: string) => http(rpc, publicClientRpcConfig)) : [http()]),
      batch: {
        multicall: {
          wait: RPC_BATCHING_WAIT_TIME,
        },
      },
    });
  }

  /**
   * Instance method that delegates to static method for convenience.
   * @param chainId - The chain ID to connect to
   * @param rpcUrls - Optional array of RPC URLs to use (overrides config if provided)
   * @returns A configured viem public client
   */
  public getPublicClient(chainId: number, rpcUrls?: string[]): PublicClient {
    return ChainsService.getPublicClient(chainId, rpcUrls);
  }

  /**
   * Gets RPC URLs for a specific chain ID from the configuration.
   *
   * @param chainId - The chain ID to get RPC URLs for
   * @returns Array of RPC URLs for the chain, or empty array if none configured
   *
   * @example
   * ```typescript
   * const rpcUrls = client.chains.getRpcUrls(1);
   * console.log('Ethereum RPC URLs:', rpcUrls);
   * ```
   */
  public getRpcUrls(chainId: number): string[] {
    return config.getRpcUrlsByChainId(chainId);
  }

  /**
   * Gets the viem chain configuration for a specific chain ID.
   *
   * @param chainId - The chain ID to get the viem chain for
   * @returns The viem chain configuration, or undefined if not found
   *
   * @example
   * ```typescript
   * const ethereumChain = client.chains.getViemChain(1);
   * console.log('Chain name:', ethereumChain?.name);
   * ```
   */
  public getViemChain(chainId: number) {
    return viemChainsById[chainId];
  }
}
