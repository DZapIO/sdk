import { PermitType } from 'src/enums';
import { HexString } from 'src/types';
import { decodeAbiParameters } from 'viem';
import { validatePermit1Data } from './permit1Methods';
import { PermitValidationResult } from 'src/types/permit';
import { validatePermit2Data } from './permit2Methods';

export async function validatePermitData({
  permitData,
  srcToken,
  amount,
  account,
  chainId,
  rpcUrls,
}: {
  permitData: HexString;
  srcToken: string;
  amount: bigint;
  account: HexString;
  chainId: number;
  rpcUrls: string[];
}): Promise<PermitValidationResult> {
  try {
    const [permitType, permitDetails] = decodeAbiParameters([{ type: 'uint8' }, { type: 'bytes' }], permitData);

    if (permitType === PermitType.PERMIT) {
      return validatePermit1Data({
        permitData: permitDetails,
        srcToken,
        amount,
        account,
        chainId,
        rpcUrls,
      });
    }

    if (permitType === PermitType.PERMIT2_APPROVE) {
      return validatePermit2Data({
        permitData: permitDetails,
        srcToken,
        amount,
        account,
        chainId,
        rpcUrls,
      });
    }

    return {
      isValid: false,
    };
  } catch (error) {
    console.error('Error validating permit data:', error);
    return {
      isValid: false,
    };
  }
}
