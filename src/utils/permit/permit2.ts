import { Wallet } from 'ethers';
import { DEFAULT_PERMIT2_ADDRESS, exclusivePermit2Addresses } from 'src/constants/contract';
import { permit2PrimaryType, PermitToDZapPermitMode, witnessType, witnessTypeName } from 'src/constants/permit';
import { SignatureExpiryInSecs } from 'src/constants/permit2';
import { StatusCodes, TxnStatus } from 'src/enums';
import { AvailableDZapServices, HexString } from 'src/types';
import { encodeAbiParameters, maxUint256, maxUint48, parseAbiParameters, WalletClient } from 'viem';
import { BatchPermitAbiParams, Permit2PrimaryType, PermitResponse } from '../../types/permit';
import { generateDeadline } from '../date';
import { signTypedData } from '../signTypedData';
import { getPermit2Values } from './getPermit2Values';
import { getPermit2Data } from './getPermitData';

export function getPermit2Address(chainId: number): HexString {
  return exclusivePermit2Addresses[chainId] ?? DEFAULT_PERMIT2_ADDRESS;
}

export const getPermit2Signature = async ({
  chainId,
  spender,
  account,
  tokens,
  signer,
  rpcUrls,
  sigDeadline = generateDeadline(SignatureExpiryInSecs),
  expiration = maxUint48,
  permitType,
  firstTokenNonce,
}: {
  chainId: number;
  account: HexString;
  tokens: { address: HexString; amount?: string; index: number }[];
  service: AvailableDZapServices;
  spender: HexString;
  rpcUrls?: string[];
  sigDeadline?: bigint;
  signer: WalletClient | Wallet;
  expiration?: bigint;
  permitType: Permit2PrimaryType;
  firstTokenNonce?: bigint;
}): Promise<Omit<PermitResponse, 'permitType'>> => {
  try {
    const permit2Address = getPermit2Address(chainId);
    const updatedTokens = tokens.map((token) => {
      return {
        ...token,
        amount: BigInt(token.amount || maxUint256),
      };
    });
    const witnessData = {
      witness: {
        owner: account,
        recipient: spender,
      },
      witnessTypeName: witnessTypeName,
      witnessType: witnessType,
    };

    const dzapPermitMode = PermitToDZapPermitMode[permitType];
    const { permit2Values, nonce } = await getPermit2Values({
      primaryType: permitType,
      spender,
      account,
      deadline: sigDeadline,
      chainId,
      permit2Address,
      rpcUrls,
      tokens: updatedTokens,
      expiration,
      firstTokenNonce: firstTokenNonce ?? null,
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

    const dZapDataForTransfer =
      permitType == permit2PrimaryType.PermitBatchWitnessTransferFrom
        ? encodeAbiParameters(BatchPermitAbiParams, [
            {
              permitted: updatedTokens.map((token) => ({ token: token.address, amount: token.amount })),
              nonce,
              deadline: sigDeadline,
            },
            signature,
          ])
        : encodeAbiParameters(parseAbiParameters('uint256, uint256, bytes'), [nonce, sigDeadline, signature]);

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
