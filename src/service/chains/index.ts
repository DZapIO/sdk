import { fetchAllSupportedChains } from '../../api';
import { Chain, ChainData } from '../../types';

/**
 * ChainsService handles all chain configuration and chain-related operations.
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
   * const chains = await client.chains.getAll();
   * const chainIds = Object.keys(chains);
   * console.log('Supported chains:', chainIds);
   * ```
   */
  public async getSupportedChains(): Promise<ChainData> {
    return fetchAllSupportedChains();
  }

  /**
   * Fetches and caches all supported blockchain configurations by DZap.
   * The chain configuration includes contract addresses, supported features, and network details.
   * Results are cached to improve performance on subsequent calls.
   *
   * @returns Promise resolving to a mapping of chain IDs to their complete configuration objects
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
      const data = await fetchAllSupportedChains();
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
}
