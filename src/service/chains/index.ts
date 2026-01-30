import type { Client } from '@bigmi/core';
import type { UTXOSchema } from '@bigmi/core';
import {
  blockchair,
  blockcypher,
  createClient,
  fallback as btcTransportFallback,
  mempool,
  publicActions,
  rpcSchema,
  walletActions,
} from '@bigmi/core';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import type { Commitment } from '@solana/web3.js';
import { clusterApiUrl, Connection } from '@solana/web3.js';
import { createPublicClient, fallback, http, type PublicClient } from 'viem';

import { TradeApiClient } from '../../api';
import { bigmiChainsById, viemChainsById } from '../../chains';
import { config } from '../../config';
import { chainIds } from '../../constants/chains';
import { MULTI_CALL_BATCH_SIZE, RPC_BATCHING_WAIT_TIME, RPC_RETRY_DELAY } from '../../constants/rpc';
import type { Chain, ChainData } from '../../types';
import { ValidationError } from '../../utils/errors';

const publicClientRpcConfig = { batch: { wait: RPC_BATCHING_WAIT_TIME }, retryDelay: RPC_RETRY_DELAY };

/** Options for chain client methods: rpcUrls (EVM), commitment (Solana) */
export type GetPublicClientOptions = {
  rpcUrls?: string[];
  commitment?: Commitment;
};

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
   * Returns a viem PublicClient for EVM chains only.
   * Use getSolanaClient / getSuiClient for Solana and Sui.
   *
   * @param chainId - EVM chain ID (e.g. 1, 42161)
   * @param options - Optional rpcUrls
   */
  public static getPublicClient(chainId: number, options?: GetPublicClientOptions): PublicClient {
    const configuredRpcUrls = options?.rpcUrls ?? config.getRpcUrlsByChainId(chainId);
    const hasRpcUrls = configuredRpcUrls && Array.isArray(configuredRpcUrls) && configuredRpcUrls.length > 0;
    const chain = viemChainsById[chainId];
    if (!chain) {
      throw new ValidationError(`Unsupported chain ID: ${chainId}`);
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
   * Returns a Solana Connection for the SVM chain.
   *
   * @param chainId - Solana chain ID (default: 7565164)
   * @param options - Optional commitment, rpcUrls
   */
  public static getPublicSolanaClient(chainId: number = chainIds.solana, options?: GetPublicClientOptions): Connection {
    const rpcUrls = options?.rpcUrls ?? config.getRpcUrlsByChainId(chainId);
    const rpc = rpcUrls?.[0] ?? clusterApiUrl('mainnet-beta');
    const commitment = options?.commitment ?? 'confirmed';
    return new Connection(rpc, commitment);
  }

  /**
   * Returns a SuiClient for the Sui chain.
   *
   * @param chainId - Sui chain ID (default: 19219)
   * @param options - Optional rpcUrls
   */
  public static getPublicSuiClient(chainId: number = chainIds.sui, options?: GetPublicClientOptions): SuiClient {
    const rpcUrls = options?.rpcUrls ?? config.getRpcUrlsByChainId(chainId);
    const rpc = rpcUrls?.[0];
    return new SuiClient({ url: rpc ?? getFullnodeUrl('mainnet') });
  }

  /**
   * Returns a Bitcoin (UTXO) client for the BVM chain.
   *
   * @param chainId - Bitcoin chain ID (default: 1000 for mainnet, 1001 for testnet)
   * @param options - Optional rpcUrls
   */
  public static getPublicBitcoinClient(chainId: number = chainIds.bitcoin, _options?: GetPublicClientOptions): Client {
    const chain = bigmiChainsById[chainId];
    if (!chain) {
      throw new ValidationError(`Unsupported chainId: ${chainId}. Supported chains: ${Object.keys(bigmiChainsById).join(', ')}`);
    }
    const baseUrl = `https://mempool.space${chain.testnet ? '/testnet4' : ''}/api`;
    return createClient({
      chain,
      rpcSchema: rpcSchema<UTXOSchema>(),
      transport: btcTransportFallback([mempool({ baseUrl }), blockchair(), blockcypher()]),
      batch: {
        multicall: {
          wait: RPC_BATCHING_WAIT_TIME,
          batchSize: MULTI_CALL_BATCH_SIZE,
        },
      },
      pollingInterval: 10_000,
    })
      .extend(publicActions)
      .extend(walletActions);
  }

  /** Instance method: EVM PublicClient */
  public getPublicClient(chainId: number, options?: GetPublicClientOptions): PublicClient {
    return ChainsService.getPublicClient(chainId, options);
  }

  /** Instance method: Solana Connection */
  public getSolanaClient(chainId?: number, options?: GetPublicClientOptions): Connection {
    return ChainsService.getPublicSolanaClient(chainId ?? chainIds.solana, options);
  }

  /** Instance method: Sui SuiClient */
  public getSuiClient(chainId?: number, options?: GetPublicClientOptions): SuiClient {
    return ChainsService.getPublicSuiClient(chainId ?? chainIds.sui, options);
  }

  /** Instance method: Bitcoin (UTXO) Client */
  public getBTCClient(chainId?: number, options?: GetPublicClientOptions): Client {
    return ChainsService.getPublicBitcoinClient(chainId ?? chainIds.bitcoin, options);
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
