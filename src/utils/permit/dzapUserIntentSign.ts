import { GaslessTxType } from 'src/constants';
import { dZapIntentPrimaryType, eip2612GaslessDomain } from 'src/constants/permit';
import { SignatureExpiryInSecs } from 'src/constants/permit2';
import { StatusCodes, TxnStatus } from 'src/enums';
import { HexString } from 'src/types';
import { DzapUserIntentBridgeTypes, DzapUserIntentSwapBridgeTypes, DzapUserIntentSwapTypes } from 'src/types/eip-2612';
import { GaslessDzapPermit } from 'src/types/permit';
import { getContract } from 'viem';
import { generateDeadline } from '../date';
import { getDZapAbi, getPublicClient } from '../index';
import { signTypedData } from '../signTypedData';

/**
 * Generate Gasless DZap user intent signature
 */
export const signGaslessDzapUserIntent = async (
  params: GaslessDzapPermit,
): Promise<{
  status: TxnStatus;
  code: StatusCodes;
  userIntentData?: {
    signature: HexString;
    nonce: bigint;
    deadline: bigint;
  };
}> => {
  try {
    const { chainId, spender, account, signer, rpcUrls, deadline = generateDeadline(SignatureExpiryInSecs), swapDataHash } = params;

    const contract = getContract({
      abi: getDZapAbi('trade'),
      address: spender,
      client: getPublicClient({ chainId, rpcUrls }),
    });

    const nonce = (await contract.read.getNonce([account])) as bigint;

    const domain = {
      name: eip2612GaslessDomain.name,
      version: eip2612GaslessDomain.version,
      chainId,
      verifyingContract: spender,
      salt: eip2612GaslessDomain.salt,
    };

    const { message, types, primaryType } =
      params.txType === GaslessTxType.swap
        ? {
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
            primaryType: dZapIntentPrimaryType.SignedGasLessSwapData,
          }
        : swapDataHash
          ? {
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
              primaryType: dZapIntentPrimaryType.SignedGasLessSwapBridgeData,
            }
          : {
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
              primaryType: dZapIntentPrimaryType.SignedGasLessBridgeData,
            };

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
      userIntentData: {
        signature,
        nonce,
        deadline,
      },
    };
  } catch (error: any) {
    console.log('Error generating permit signature:', error);
    if (error?.cause?.code === StatusCodes.UserRejectedRequest || error?.code === StatusCodes.UserRejectedRequest) {
      return { status: TxnStatus.rejected, code: StatusCodes.UserRejectedRequest };
    }
    return { status: TxnStatus.error, code: StatusCodes.Error };
  }
};
