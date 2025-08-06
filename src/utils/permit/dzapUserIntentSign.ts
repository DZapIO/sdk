import { GaslessTxType } from 'src/constants';
import { eip2612GaslessDomain } from 'src/constants/permit';
import { SignatureExpiryInSecs } from 'src/constants/permit2';
import { StatusCodes, TxnStatus } from 'src/enums';
import { HexString } from 'src/types';
import { EIP2612BridgeTypes, EIP2612SwapTypes } from 'src/types/eip-2612';
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
    const { chainId, spender, account, signer, rpcUrls, deadline = generateDeadline(SignatureExpiryInSecs) } = params;

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

    const message =
      params.txType === GaslessTxType.swap
        ? {
            txId: params.txId,
            user: account,
            executorFeesHash: params.executorFeesHash,
            swapDataHash: params.swapDataHash,
            nonce,
            deadline,
          }
        : {
            txId: params.txId,
            user: account,
            nonce,
            deadline,
            executorFeesHash: params.executorFeesHash,
            swapDataHash: params.swapDataHash,
            adapterDataHash: params.adapterDataHash,
          };

    const types = params.txType === GaslessTxType.swap ? EIP2612SwapTypes : EIP2612BridgeTypes;

    const signature = await signTypedData({
      signer,
      domain,
      message,
      types,
      account,
      primaryType: 'Permit',
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
