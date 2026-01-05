import { getContract } from 'viem';
import { GASLESS_TX_TYPE } from '../../constants';
import { DZapIntentPrimaryTypes, EIP2612_GASLESS_DOMAIN, SIGNATURE_EXPIRY_IN_SECS } from '../../constants/permit';
import { StatusCodes, TxnStatus } from '../../enums';
import { HexString } from '../../types';
import { DzapUserIntentBridgeTypes, DzapUserIntentSwapBridgeTypes, DzapUserIntentSwapTypes } from '../../types/eip-2612';
import { Gasless2612PermitParams, CustomTypedDataParams } from '../../types/permit';
import { generateDeadline } from '../../utils/date';
import { handleViemTransactionError } from '../../utils/errors';
import { getDZapAbi } from '../../utils/abi';
import { getPublicClient } from '../../utils/client';
import { signTypedData } from '../../utils/signer';

/**
 * SignIntent
 *
 * A service class for handling signing of various intent types including
 * gasless transactions and custom typed data.
 */
export class SignIntent {
  /**
   * Private helper method to get the typed data structure for gasless transactions
   */
  private static getSignTypedData(
    params: Gasless2612PermitParams & {
      nonce: bigint;
    },
  ) {
    const { account, deadline, nonce, swapDataHash } = params;

    if (params.txType === GASLESS_TX_TYPE.swap) {
      return {
        message: {
          //swap
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
    } else if (swapDataHash) {
      return {
        message: {
          //swapBridge
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
    } else {
      return {
        message: {
          //bridge
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
  }

  /**
   * Sign a gasless intent transaction
   *
   * @param params - Parameters for gasless intent
   * @returns Promise with signature, nonce, and deadline
   */
  static async signGaslessIntent(params: Gasless2612PermitParams): Promise<{
    status: TxnStatus;
    code: StatusCodes;
    data?: {
      signature: HexString;
      nonce: bigint;
      deadline: bigint;
    };
  }> {
    try {
      const { chainId, spender, account, signer, rpcUrls } = params;
      const deadline = params.deadline || generateDeadline(SIGNATURE_EXPIRY_IN_SECS);

      const contract = getContract({
        abi: getDZapAbi('trade', params.contractVersion),
        address: spender,
        client: getPublicClient({ chainId, rpcUrls }),
      });

      const nonce = (await contract.read.getNonce([account])) as bigint;

      const domain = {
        name: EIP2612_GASLESS_DOMAIN.name,
        version: EIP2612_GASLESS_DOMAIN.version,
        chainId,
        verifyingContract: spender,
        salt: EIP2612_GASLESS_DOMAIN.salt,
      };

      const { message, types, primaryType } = this.getSignTypedData({
        ...params,
        deadline,
        nonce,
      });

      const signature = await signTypedData({
        signer,
        domain,
        message,
        types,
        account,
        primaryType,
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
    } catch (error: any) {
      return handleViemTransactionError({ error });
    }
  }

  /**
   * Sign custom typed data
   *
   * @param params - Parameters for custom typed data signing
   * @returns Promise with signature and message
   */
  static async signCustomTypedData(params: CustomTypedDataParams): Promise<{
    status: TxnStatus;
    code: StatusCodes;
    data?: {
      signature: HexString;
      message: Record<string, any>;
    };
  }> {
    try {
      const { account, signer, message, domain, primaryType, types } = params;

      const signature = await signTypedData({
        signer,
        account,
        domain,
        message,
        primaryType,
        types,
      });
      return {
        status: TxnStatus.success,
        code: StatusCodes.Success,
        data: {
          signature,
          message,
        },
      };
    } catch (error: any) {
      return handleViemTransactionError({ error });
    }
  }
}
