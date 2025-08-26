import { GaslessTxType } from 'src/constants';
import { dZapIntentPrimaryType, eip2612GaslessDomain } from 'src/constants/permit';
import { SignatureExpiryInSecs } from 'src/constants/permit2';
import { StatusCodes, TxnStatus } from 'src/enums';
import { HexString } from 'src/types';
import { DzapUserIntentBridgeTypes, DzapUserIntentSwapBridgeTypes, DzapUserIntentSwapTypes } from 'src/types/eip-2612';
import { Gasless2612PermitParams } from 'src/types/permit';
import { getContract } from 'viem';
import { generateDeadline } from '../date';
import { getDZapAbi, getPublicClient } from '../index';
import { signTypedData } from '../signTypedData';

const getSignTypedData = (
  params: Gasless2612PermitParams & {
    nonce: bigint;
  },
) => {
  const { account, deadline, nonce, swapDataHash } = params;

  if (params.txType === GaslessTxType.swap) {
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
      primaryType: dZapIntentPrimaryType.SignedGasLessSwapData,
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
      primaryType: dZapIntentPrimaryType.SignedGasLessSwapBridgeData,
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
      primaryType: dZapIntentPrimaryType.SignedGasLessBridgeData,
    };
  }
};

/**
 * Generate Gasless DZap user intent signature
 */
export const signGaslessDzapUserIntent = async (
  params: Gasless2612PermitParams,
): Promise<{
  status: TxnStatus;
  code: StatusCodes;
  data?: {
    signature: HexString;
    nonce: bigint;
    deadline: bigint;
  };
}> => {
  try {
    const { chainId, spender, account, signer, rpcUrls } = params;
    const deadline = params.deadline || generateDeadline(SignatureExpiryInSecs);

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

    const { message, types, primaryType } = getSignTypedData({
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
    console.log('Error generating permit signature:', error);
    if (error?.cause?.code === StatusCodes.UserRejectedRequest || error?.code === StatusCodes.UserRejectedRequest) {
      return { status: TxnStatus.rejected, code: StatusCodes.UserRejectedRequest };
    }
    return { status: TxnStatus.error, code: StatusCodes.Error };
  }
};
