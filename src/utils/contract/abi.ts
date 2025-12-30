import * as ABI from '../../artifacts';
import { AvailableDZapServices, OtherAvailableAbis } from '../../types';
import { DZapAbis, OtherAbis, Services } from '../../constants';
import { ContractVersion } from '../../enums';

/**
 * Gets the appropriate DZap contract ABI based on service and version
 * @param service - The DZap service (trade, dca, zap)
 * @param version - The contract version
 * @returns The corresponding ABI
 * @throws Error if invalid service or version is provided
 */
export const getDZapAbi = (service: AvailableDZapServices, version: ContractVersion) => {
  switch (service) {
    case Services.trade:
      switch (version) {
        case ContractVersion.v1:
          return ABI[DZapAbis.dZapCoreAbi];
        case ContractVersion.v2:
          return ABI[DZapAbis.dZapCoreV2Abi];
        default:
          throw new Error('Invalid Version for Trade');
      }
    case Services.dca:
      return ABI[DZapAbis.dZapDcaAbi];
    case Services.zap:
    default:
      throw new Error('Invalid Service');
  }
};

/**
 * Gets other commonly used ABIs
 * @param name - The name of the ABI to retrieve (e.g., permit2, erc20)
 * @returns The requested ABI
 * @throws Error if invalid ABI name is provided
 */
export const getOtherAbis = (name: OtherAvailableAbis) => {
  switch (name) {
    case OtherAbis.permit2:
      return ABI.permit2Abi;
    case OtherAbis.erc20:
      return ABI.erc20Abi;
    default:
      throw new Error('Invalid Abi');
  }
};
