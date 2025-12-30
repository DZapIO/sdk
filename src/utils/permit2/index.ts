import { DEFAULT_PERMIT2_ADDRESS, exclusivePermit2Addresses } from '../../constants/blockchain/contract';
import { permit2PrimaryType, PermitToDZapPermitMode, SIGNATURE_EXPIRY_IN_SECS } from '../../constants/blockchain/permit';
import { ContractVersion, DZapV1PermitMode, StatusCodes, TxnStatus } from '../../enums';
import { HexString } from '../../types';
import { encodeAbiParameters, maxUint256, maxUint48, parseAbiParameters } from 'viem';
import { BasePermitResponse, BatchPermitAbiParams, Permit2Params } from '../../types/permit';
import { generateDeadline } from '../date';
import { signTypedData } from '../signTypedData';
import { getPermit2Data } from './permitData';
import { getPermit2Values } from './values';
import { getPermit2WitnessData } from './witnessData';
import { Services } from '../../constants';

export function getPermit2Address(chainId: number): HexString {
  return exclusivePermit2Addresses[chainId] ?? DEFAULT_PERMIT2_ADDRESS;
}

export const getPermit2Signature = async (params: Permit2Params): Promise<BasePermitResponse> => {
  try {
    const {
      chainId,
      account,
      tokens,
      spender,
      rpcUrls,
      deadline: sigDeadline,
      signer,
      permitType,
      firstTokenNonce,
      contractVersion,
      service,
    } = params;
    const deadline = sigDeadline ?? generateDeadline(SIGNATURE_EXPIRY_IN_SECS);
    const expiration = params.expiration ?? maxUint48;

    const permit2Address = getPermit2Address(chainId);
    const updatedTokens = tokens.map((token) => {
      return {
        ...token,
        amount: BigInt(token.amount || maxUint256).toString(),
      };
    });
    const { witnessData } = getPermit2WitnessData(params);

    const { permit2Values, nonce } = await getPermit2Values({
      primaryType: permitType,
      spender,
      account,
      deadline,
      chainId,
      permit2Address,
      rpcUrls,
      tokens: updatedTokens,
      expiration,
      firstTokenNonce: firstTokenNonce ?? null,
      service,
      contractVersion,
    });

    const signTypedPermit2Data = getPermit2Data(permit2Values, permit2Address, chainId, witnessData);

    const signature = await signTypedData({
      signer,
      domain: signTypedPermit2Data.domain,
      message: signTypedPermit2Data.message,
      types: signTypedPermit2Data.types,
      account,
      primaryType: permitType,
    });

    let dZapDataForTransfer;
    if (permitType === permit2PrimaryType.PermitBatchWitnessTransferFrom) {
      dZapDataForTransfer = encodeAbiParameters(BatchPermitAbiParams, [
        {
          permitted: updatedTokens.map((token) => ({ token: token.address, amount: BigInt(token.amount) })),
          nonce,
          deadline,
        },
        signature,
      ]);
    } else if (permitType === permit2PrimaryType.PermitWitnessTransferFrom) {
      dZapDataForTransfer = encodeAbiParameters(parseAbiParameters('uint256, uint256, bytes'), [nonce, deadline, signature]);
    } else if (contractVersion === ContractVersion.v1 && service !== Services.zap) {
      //for v1 support
      dZapDataForTransfer = encodeAbiParameters(
        parseAbiParameters('uint160 allowanceAmount, uint48 nonce, uint48 expiration, uint256 sigDeadline, bytes signature'),
        [BigInt(tokens[0].amount), Number(nonce.toString()), Number(expiration.toString()), BigInt(deadline.toString()), signature],
      );
    } else {
      dZapDataForTransfer = encodeAbiParameters(parseAbiParameters('uint48 nonce, uint48 expiration, uint256 sigDeadline, bytes signature'), [
        Number(nonce.toString()),
        Number(expiration.toString()),
        BigInt(deadline.toString()),
        signature,
      ]);
    }

    const dzapPermitMode =
      service !== Services.zap && contractVersion === ContractVersion.v1 ? DZapV1PermitMode.PERMIT2_APPROVE : PermitToDZapPermitMode[permitType];
    const permitData = encodeAbiParameters(parseAbiParameters('uint8, bytes'), [dzapPermitMode, dZapDataForTransfer]);

    return {
      status: TxnStatus.success,
      code: StatusCodes.Success,
      permitData,
      nonce,
    };
  } catch (error: any) {
    console.log('Error generating permit2 witness transfer signature:', error);
    if (error?.cause?.code === StatusCodes.UserRejectedRequest || error?.code === StatusCodes.UserRejectedRequest) {
      return { status: TxnStatus.rejected, code: StatusCodes.UserRejectedRequest };
    }
    return { status: TxnStatus.error, code: StatusCodes.Error };
  }
};
