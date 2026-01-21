import { getContract } from 'viem';

import { GASLESS_TX_TYPE } from '../../../constants';
import { EIP2612_GASLESS_DOMAIN, SIGNATURE_EXPIRY_IN_SECS } from '../../../constants/permit';
import { DZapIntentPrimaryTypes } from '../../../constants/permit';
import { StatusCodes, TxnStatus } from '../../../enums';
import type { HexString } from '../../../types';
import { DzapUserIntentBridgeTypes, DzapUserIntentSwapBridgeTypes, DzapUserIntentSwapTypes } from '../../../types/eip-2612';
import type { Gasless2612PermitParams } from '../../../types/permit';
import { generateDeadline } from '../../../utils/date';
import { handleViemTransactionError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { signTypedData } from '../../../utils/signer';
import { ChainsService } from '../../chains';
import { ContractsService } from '../../contracts';

/**
 * Gasless - Static class for handling gasless intent signature generation
 * This service provides methods for generating signatures for gasless swap, bridge, and swap-bridge transactions
 */
export class Gasless {
  /**
   * Generates a complete gasless intent signature with nonce and deadline
   * @param params - Gasless intent parameters including transaction type and data hashes
   * @returns Promise resolving to signature response with signature, nonce, and deadline
   */
  public static async generateSignature(params: Gasless2612PermitParams): Promise<{
    status: TxnStatus;
    code: StatusCodes;
    data?: {
      signature: HexString;
      nonce: bigint;
      deadline: bigint;
    };
  }> {
    try {
      const { chainId, spender, account, signer, rpcUrls, contractVersion } = params;
      const deadline = params.deadline || generateDeadline(SIGNATURE_EXPIRY_IN_SECS);

      const contract = getContract({
        abi: ContractsService.getDZapAbi('trade', contractVersion),
        address: spender,
        client: ChainsService.getPublicClient(chainId, rpcUrls),
      });

      const nonce = (await contract.read.getNonce([account])) as bigint;

      const typedData = this.buildTypedData({
        ...params,
        deadline,
        nonce,
      });

      const signature = await signTypedData({
        signer,
        domain: typedData.domain,
        message: typedData.message,
        types: typedData.types,
        account,
        primaryType: typedData.primaryType,
      });

      return {
        status: TxnStatus.success,
        code: StatusCodes.Success,
        data: {
          signature,
          nonce,
          deadline,
        },
      };
    } catch (error: unknown) {
      logger.error('Failed to generate gasless intent signature', {
        service: 'GaslessService',
        method: 'generateSignature',
        chainId: params.chainId,
        txType: params.txType,
        error,
      });
      return handleViemTransactionError({ error });
    }
  }

  /**
   * Builds the EIP-712 typed data structure for gasless transactions
   * Handles swap, bridge, and swap-bridge transaction types
   * @param params - Gasless intent parameters with nonce and deadline
   * @returns Typed data object ready for signing
   */
  public static buildTypedData(params: Gasless2612PermitParams & { nonce: bigint; deadline: bigint }): {
    domain: {
      name: string;
      version: string;
      chainId: number;
      verifyingContract: HexString;
      salt: HexString;
    };
    types: typeof DzapUserIntentSwapTypes | typeof DzapUserIntentSwapBridgeTypes | typeof DzapUserIntentBridgeTypes;
    message: Record<string, any>;
    primaryType: string;
  } {
    const { account, deadline, nonce, swapDataHash } = params;

    if (params.txType === GASLESS_TX_TYPE.swap) {
      return {
        domain: this.buildDomain(params.spender, params.chainId),
        message: {
          txId: params.txId,
          user: account,
          executorFeesHash: params.executorFeesHash,
          swapDataHash: params.swapDataHash,
          nonce,
          deadline,
        },
        types: DzapUserIntentSwapTypes,
        primaryType: DZapIntentPrimaryTypes.SignedGasLessSwapData,
      };
    }

    if (swapDataHash) {
      return {
        domain: this.buildDomain(params.spender, params.chainId),
        message: {
          txId: params.txId,
          user: account,
          nonce,
          deadline,
          executorFeesHash: params.executorFeesHash,
          swapDataHash: params.swapDataHash,
          adapterDataHash: params.adapterDataHash,
        },
        types: DzapUserIntentSwapBridgeTypes,
        primaryType: DZapIntentPrimaryTypes.SignedGasLessSwapBridgeData,
      };
    }

    return {
      domain: this.buildDomain(params.spender, params.chainId),
      message: {
        txId: params.txId,
        user: account,
        nonce,
        deadline,
        executorFeesHash: params.executorFeesHash,
        adapterDataHash: params.adapterDataHash,
      },
      types: DzapUserIntentBridgeTypes,
      primaryType: DZapIntentPrimaryTypes.SignedGasLessBridgeData,
    };
  }

  /**
   * Builds the EIP-712 domain for gasless transactions
   * @param verifyingContract - Contract address that will verify the signature
   * @param chainId - Chain ID
   * @returns EIP-712 domain object
   */
  public static buildDomain(
    verifyingContract: HexString,
    chainId: number,
  ): {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: HexString;
    salt: HexString;
  } {
    return {
      name: EIP2612_GASLESS_DOMAIN.name,
      version: EIP2612_GASLESS_DOMAIN.version,
      chainId,
      verifyingContract,
      salt: EIP2612_GASLESS_DOMAIN.salt,
    };
  }
}
