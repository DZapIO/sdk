import * as ABI from '../../artifacts';
import { Services, STANDARD_ABIS } from '../../constants';
import { ContractVersion } from '../../enums';
import type { AvailableDZapServices, StandardAbis } from '../../types';
import { NotFoundError, ValidationError } from '../../utils/errors';
import type { ChainsService } from '../chains';

/**
 * ContractsService handles ABI and contract address operations for DZap protocol.
 */
export class ContractsService {
  constructor(private chainsService: ChainsService) {}

  /**
   * Retrieves the deployed contract address for a specific DZap service on a given blockchain.
   * Different services (trade, dca, zap) may use different contract addresses.
   * This method ensures you get the correct contract address for the intended operation.
   *
   * @param params - Configuration object for contract address lookup
   * @param params.chainId - The blockchain network ID to get the contract address for
   * @param params.service - The DZap service type to get the contract address for
   * @returns Promise resolving to the contract address string
   *
   * @example
   * ```typescript
   * const tradeContract = await client.contracts.getAddress({
   *   chainId: 1,
   *   service: 'trade'
   * });
   *
   * const zapContract = await client.contracts.getAddress({
   *   chainId: 42161,
   *   service: 'zap'
   * });
   * ```
   */
  public async getAddress({ chainId, service }: { chainId: number; service: AvailableDZapServices }): Promise<string> {
    const chainConfig = await this.chainsService.getConfig();
    if (!chainConfig?.[chainId]?.isEnabled) {
      throw new ValidationError('Chains config not found');
    }

    const chainData = chainConfig[chainId];
    if (!chainData?.contracts) {
      throw new NotFoundError(`No contracts found for chain: ${chainId}`);
    }

    const contractMap: Record<string, string | undefined> = {
      [Services.trade]: chainData.contracts.router,
      [Services.dca]: chainData.contracts.dca,
      [Services.zap]: chainData.contracts.zap,
    };

    const contractAddress = contractMap[service];

    if (!contractAddress) {
      throw new NotFoundError(`Contract not found for service "${service}" on chain: ${chainId}`);
    }

    return contractAddress;
  }

  /**
   * Returns the Application Binary Interface (ABI) for a specific DZap service contract.
   * Use this to interact with DZap contracts directly or for custom contract operations.
   *
   * @param service - The DZap service name (trade, dca, or zap)
   * @param version - The contract version (v1 or v2)
   * @returns The ABI array for the specified service contract
   *
   * @example
   * ```typescript
   * const tradeAbi = client.contracts.getDZapAbi('trade', ContractVersion.v2);
   * const zapAbi = client.contracts.getDZapAbi('zap', ContractVersion.v2);
   * ```
   */
  public static getDZapAbi(service: AvailableDZapServices, version: ContractVersion) {
    switch (service) {
      case Services.trade:
        switch (version) {
          case ContractVersion.v1:
            return ABI.core.dZapCoreAbi;
          case ContractVersion.v2:
            return ABI.core.dZapCoreV2Abi;
          default:
            throw new ValidationError('Invalid Version for Trade');
        }
      case Services.dca:
        return ABI.dca.dZapDcaAbi;
      case Services.zap:
      default:
        throw new ValidationError('Invalid Service');
    }
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
   * const erc20Abi = client.contracts.getStandardAbi('ERC20');
   * const permit2Abi = client.contracts.getStandardAbi('Permit2');
   * ```
   */
  public static getStandardAbi(name: StandardAbis) {
    switch (name) {
      case STANDARD_ABIS.permit2:
        return ABI.permit.permit2Abi;
      case STANDARD_ABIS.erc20:
        return ABI.erc20Abi;
      default:
        throw new ValidationError('Invalid Abi');
    }
  }
}
