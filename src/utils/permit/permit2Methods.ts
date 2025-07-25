import { Wallet } from 'ethers';
import { DEFAULT_PERMIT2_ADDRESS, exclusivePermit2Addresses } from 'src/constants/contract';
import { permit2PrimaryType, PermitTypes } from 'src/constants/permit';
import { SignatureExpiryInSecs } from 'src/constants/permit2';
import { PermitType, StatusCodes, TxnStatus } from 'src/enums';
import { AvailableDZapServices, HexString } from 'src/types';
import { encodeAbiParameters, maxUint256, maxUint48, parseAbiParameters, WalletClient } from 'viem';
import { generateDeadline } from '../date';
import { signTypedData } from '../signTypedData';
import { getPermit2Values } from './getPermit2Values';
import { getPermit2Data } from './getPermitData';
import { Permit2PrimaryType } from './types';

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
  permitType: primaryType,
}: {
  chainId: number;
  account: HexString;
  tokens: { address: HexString; amount?: string }[];
  service: AvailableDZapServices;
  spender: HexString;
  rpcUrls?: string[];
  sigDeadline?: bigint;
  signer: WalletClient | Wallet;
  expiration?: bigint;
  permitType: Permit2PrimaryType;
}): Promise<{ status: TxnStatus; code: StatusCodes; permitData?: HexString }> => {
  try {
    const permit2Address = getPermit2Address(chainId);
    const updatedTokens = tokens.map((token) => {
      return {
        token: token.address,
        amount: BigInt(token.amount || maxUint256),
      };
    });
    const witnessData = {
      witness: {
        owner: account,
        recipient: spender,
      },
      witnessTypeName: 'DZapTransferWitness',
      witnessType: {
        DZapTransferWitness: [
          { name: 'owner', type: 'address' },
          { name: 'recipient', type: 'address' },
        ],
      },
    };

    const permit2Type =
      primaryType === PermitTypes.PermitSingle
        ? permit2PrimaryType.PermitSingle
        : primaryType === PermitTypes.PermitWitnessTransferFrom
          ? permit2PrimaryType.PermitWitnessTransferFrom
          : primaryType === PermitTypes.PermitBatchWitnessTransferFrom
            ? permit2PrimaryType.PermitBatchWitnessTransferFrom
            : null;

    if (!permit2Type) {
      throw new Error(`Invalid permit type: ${permit2Type}`);
    }
    const permitType =
      permit2Type === permit2PrimaryType.PermitSingle
        ? PermitType.PERMIT2_APPROVE
        : permit2Type === permit2PrimaryType.PermitWitnessTransferFrom
          ? PermitType.PERMIT2_WITNESS_TRANSFER
          : permit2Type === permit2PrimaryType.PermitBatchWitnessTransferFrom
            ? PermitType.BATCH_PERMIT2_WITNESS_TRANSFER
            : null;

    if (!permitType) {
      throw new Error(`Invalid permit type: ${permitType}`);
    }
    const { permit2Values, nonce } = await getPermit2Values({
      primaryType: permit2Type,
      spender,
      account,
      deadline: sigDeadline,
      chainId,
      permit2Address,
      rpcUrls,
      permitted: updatedTokens,
      expiration,
    });

    const signTypedPermit2Data = getPermit2Data(permit2Values, permit2Address, chainId, witnessData);

    const signature = await signTypedData({
      signer,
      domain: signTypedPermit2Data.domain,
      message: signTypedPermit2Data.message,
      types: signTypedPermit2Data.types,
      account,
      primaryType,
    });

    const dZapDataForTransfer = encodeAbiParameters(parseAbiParameters('uint256, uint256, bytes'), [nonce, sigDeadline, signature]);

    const permitData = encodeAbiParameters(parseAbiParameters('uint8, bytes'), [permitType, dZapDataForTransfer]);

    return {
      status: TxnStatus.success,
      code: StatusCodes.Success,
      permitData,
    };
  } catch (error: any) {
    console.log('Error generating permit2 witness transfer signature:', error);
    if (error?.cause?.code === StatusCodes.UserRejectedRequest || error?.code === StatusCodes.UserRejectedRequest) {
      return { status: TxnStatus.rejected, code: StatusCodes.UserRejectedRequest };
    }
    return { status: TxnStatus.error, code: StatusCodes.Error };
  }
};
