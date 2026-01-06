import { AvailableDZapServices, ChainData, OtherAvailableAbis } from '../../types';
import { getDZapAbi, getOtherAbis } from '../../utils';
import { ContractVersion } from '../../enums';

/**
 * ContractsService handles ABI and contract address operations for DZap protocol.
 */
export class ContractsService {
  constructor(private getChainConfig: () => Promise<ChainData>) {}

  /**
   * Retrieves the deployed contract address for a specific DZap service on a given blockchain.
   * Different services (swap, bridge, dca, zap) may use different contract addresses.
   * This method ensures you get the correct contract address for the intended operation.
   *
   * @param params - Configuration object for contract address lookup
   * @param params.chainId - The blockchain network ID to get the contract address for
   * @param params.service - The DZap service type to get the contract address for
   * @returns Promise resolving to the contract address string
   *
   * @example
   * ```typescript
   * const swapContract = await client.contracts.getAddress({
   *   chainId: 1,
   *   service: 'swap'
   * });
   *
   * const zapContract = await client.contracts.getAddress({
   *   chainId: 42161,
   *   service: 'zap'
   * });
   * ```
   */
  public async getAddress({ chainId, service }: { chainId: number; service: AvailableDZapServices }): Promise<string> {
    const chainConfig = await this.getChainConfig();
    if (!chainConfig[chainId]?.isEnabled || !chainConfig) {
      throw new Error('Chains config not found');
    }

    const chainData = chainConfig[chainId];
    if (!chainData?.contracts) {
      throw new Error(`No contracts found for chain: ${chainId}`);
    }

    const contractMap: Record<string, string | undefined> = {
      trade: chainData.contracts.router,
      dca: chainData.contracts.dca,
      zap: chainData.contracts.zap,
    };

    const contractAddress = contractMap[service];

    if (!contractAddress) {
      throw new Error(`Contract not found for service "${service}" on chain: ${chainId}`);
    }

    return contractAddress;
  }

  /**
   * Returns the Application Binary Interface (ABI) for a specific DZap service contract.
   * Use this to interact with DZap contracts directly or for custom contract operations.
   *
   * @param service - The DZap service name (swap, bridge, dca, or zap)
   * @param version - The contract version (v1 or v2)
   * @returns The ABI array for the specified service contract
   *
   * @example
   * ```typescript
   * const swapAbi = client.contracts.getDZapAbi('swap', ContractVersion.v2);
   * const bridgeAbi = client.contracts.getDZapAbi('bridge', ContractVersion.v2);
   * ```
   */
  public getDZapAbi(service: AvailableDZapServices, version: ContractVersion) {
    return getDZapAbi(service, version);
  }

  /**
   * Returns the Application Binary Interface (ABI) for non-core contracts used by the DZap protocol.
   * This includes contracts like ERC20, Permit2, and other auxiliary contracts.
   *
   * @param name - The contract name to get the ABI for
   * @returns The ABI array for the specified contract
   *
   * @example
   * ```typescript
   * const erc20Abi = client.contracts.getOtherAbi('ERC20');
   * const permit2Abi = client.contracts.getOtherAbi('Permit2');
   * ```
   */
  public getOtherAbi(name: OtherAvailableAbis) {
    return getOtherAbis(name);
  }
}
