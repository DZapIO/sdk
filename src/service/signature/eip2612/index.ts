import { ethers } from 'ethers';
import type { TypedDataDomain } from 'viem';
import { encodeAbiParameters, maxUint256, parseAbiParameters } from 'viem';

import { Services } from '../../../constants';
import { SIGNATURE_EXPIRY_IN_SECS } from '../../../constants/permit';
import { ContractVersion, DZapPermitMode, StatusCodes, TxnStatus } from '../../../enums';
import type { AvailableDZapServices, HexString } from '../../../types';
import { EIP2612DefaultTypes } from '../../../types/eip-2612';
import type { DefaultPermit2612Params } from '../../../types/permit';
import { generateDeadline } from '../../../utils/date';
import { logger } from '../../../utils/logger';
import { signTypedData } from '../../../utils/signer';

/**
 * EIP2612 - Static class for handling EIP-2612 permit signature generation
 * This service provides methods for generating and encoding EIP-2612 signatures used for token approvals
 */
export class EIP2612 {
  /**
   * Generates a complete EIP-2612 permit signature with encoded data ready for transaction
   * @param params - EIP-2612 permit parameters including token, spender, and chain info
   * @returns Promise resolving to permit response with signature and encoded data
   */
  public static async generateSignature(params: DefaultPermit2612Params): Promise<{ status: TxnStatus; code: StatusCodes; permitData?: HexString }> {
    try {
      const {
        chainId,
        spender,
        account,
        token,
        signer,
        contractVersion,
        service,
        name,
        nonce,
        version,
        deadline = generateDeadline(SIGNATURE_EXPIRY_IN_SECS),
      } = params;

      const { address } = token;
      const amount = token.amount ? BigInt(token.amount) : maxUint256;

      const domain = this.buildDomain(address, chainId, name, version, token?.permit?.eip2612?.data?.domain);
      const typedData = this.buildTypedData(account, spender, amount, nonce, deadline, domain);
      const signature = await signTypedData({
        signer,
        domain: typedData.domain,
        message: typedData.message,
        types: typedData.types,
        account,
        primaryType: 'Permit',
      });

      const permitData = this.encodePermitData({
        account,
        spender,
        amount,
        deadline,
        signature,
        contractVersion,
        service,
      });

      return {
        status: TxnStatus.success,
        code: StatusCodes.Success,
        permitData,
      };
    } catch (error: unknown) {
      const err = error as { cause?: { code?: StatusCodes }; code?: StatusCodes };
      logger.error('Error generating EIP-2612 permit signature', {
        service: 'EIP2612Service',
        method: 'generateSignature',
        chainId: params.chainId,
        error,
      });
      if (err?.cause?.code === StatusCodes.UserRejectedRequest || err?.code === StatusCodes.UserRejectedRequest) {
        return { status: TxnStatus.rejected, code: StatusCodes.UserRejectedRequest };
      }
      return { status: TxnStatus.error, code: StatusCodes.Error };
    }
  }

  /**
   * Builds the EIP-712 typed data structure for EIP-2612 permit
   * @param owner - Token owner address
   * @param spender - Spender address
   * @param value - Token amount
   * @param nonce - Token nonce
   * @param deadline - Permit deadline
   * @param domain - EIP-712 domain
   * @returns Typed data object ready for signing
   */
  public static buildTypedData(
    owner: HexString,
    spender: HexString,
    value: bigint,
    nonce: bigint,
    deadline: bigint,
    domain: TypedDataDomain,
  ): {
    domain: TypedDataDomain;
    types: typeof EIP2612DefaultTypes;
    message: {
      owner: HexString;
      spender: HexString;
      value: bigint;
      nonce: bigint;
      deadline: bigint;
    };
  } {
    return {
      domain,
      types: EIP2612DefaultTypes,
      message: {
        owner,
        spender,
        value,
        nonce,
        deadline,
      },
    };
  }

  /**
   * Builds the EIP-712 domain for EIP-2612 permit
   * @param address - Token contract address
   * @param chainId - Chain ID
   * @param name - Token name
   * @param version - Token version
   * @param customDomain - Optional custom domain override
   * @returns EIP-712 domain object
   */
  public static buildDomain(address: HexString, chainId: number, name: string, version: string, customDomain?: TypedDataDomain): TypedDataDomain {
    if (customDomain) {
      return customDomain;
    }

    return {
      name,
      version,
      chainId,
      verifyingContract: address,
    };
  }

  /**
   * Encodes permit data for contract execution
   * @param params - Parameters including signature and contract version
   * @returns Encoded permit data as hex string
   */
  public static encodePermitData({
    account,
    spender,
    amount,
    deadline,
    signature,
    contractVersion,
    service,
  }: {
    account: HexString;
    spender: HexString;
    amount: bigint;
    deadline: bigint;
    signature: HexString;
    contractVersion?: ContractVersion;
    service?: AvailableDZapServices;
  }): HexString {
    const sig = ethers.utils.splitSignature(signature);

    const dZapPermitData =
      contractVersion === ContractVersion.v1 && service !== Services.zap
        ? ethers.utils.defaultAbiCoder.encode(
            ['address', 'address', 'uint256', 'uint256', 'uint8', 'bytes32', 'bytes32'],
            [account, spender, amount, deadline, sig.v, sig.r, sig.s],
          )
        : ethers.utils.defaultAbiCoder.encode(['uint256', 'uint8', 'bytes32', 'bytes32'], [deadline, sig.v, sig.r, sig.s]);

    return encodeAbiParameters(parseAbiParameters('uint8, bytes'), [DZapPermitMode.PERMIT, dZapPermitData as HexString]);
  }
}
