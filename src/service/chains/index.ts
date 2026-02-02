import type { Client } from '@bigmi/core';
import type { SuiClient } from '@mysten/sui/dist/cjs/client';
import type { Connection } from '@solana/web3.js';
import type { PublicClient } from 'viem';

import { TradeApiClient } from '../../api';
import { viemChainsById } from '../../chains';
import type { ChainPublicClient, PublicClientOptions } from '../../chains/clients';
import { getChainClient } from '../../chains/clients';
import { config } from '../../config';
import type { chainIds } from '../../constants';
import type { Chain, ChainData } from '../../types';

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
  public static getPublicClient(chainId: number, options?: PublicClientOptions): PublicClient;
  public static getPublicClient(chainId: typeof chainIds.solana, options?: PublicClientOptions): Connection;
  public static getPublicClient(chainId: typeof chainIds.sui, options?: PublicClientOptions): SuiClient;
  public static getPublicClient(chainId: typeof chainIds.bitcoin | typeof chainIds.bitcoinTestnet, options?: PublicClientOptions): Client;
  public static getPublicClient(chainId: number, options?: PublicClientOptions): ChainPublicClient {
    return getChainClient(chainId).getPublicClient(chainId, options);
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
