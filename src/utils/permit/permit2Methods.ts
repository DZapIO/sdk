import { Signer } from 'ethers';
import { Services } from 'src/constants';
import { DEFAULT_PERMIT2_ADDRESS, exclusivePermit2Addresses } from 'src/constants/contract';
import { erc20PermitFunctions } from 'src/constants/erc20';
import { SignatureExpiryInSecs } from 'src/constants/permit2';
import { ContractVersion, DZapPermitMode, PermitType, StatusCodes, TxnStatus, ZapPermitType } from 'src/enums';
import { AvailableDZapServices, HexString } from 'src/types';
import { WalletClient, encodeAbiParameters, maxUint256, maxUint48, parseAbiParameters } from 'viem';
import { abi as Permit2Abi } from '../../artifacts/Permit2';
import { generateDeadline } from '../date';
import { getPublicClient } from '../index';
import { signTypedData } from '../signTypedData';

export function getPermit2Address(chainId: number): HexString {
  return exclusivePermit2Addresses[chainId] ?? DEFAULT_PERMIT2_ADDRESS;
}

export async function getPermit2Signature({
  chainId,
  spender,
  service,
  account,
  token,
  signer,
  rpcUrls,
  amount = maxUint256,
  sigDeadline = generateDeadline(SignatureExpiryInSecs),
  expiration = maxUint48,
  contractVersion,
}: {
  chainId: number;
  account: HexString;
  token: HexString;
  service: AvailableDZapServices;
  spender: HexString;
  rpcUrls?: string[];
  sigDeadline?: bigint;
  amount?: bigint;
  signer: WalletClient | Signer;
  expiration?: bigint;
  contractVersion: ContractVersion;
}) {
  try {
    const permit2Address = getPermit2Address(chainId);
    const publicClient = getPublicClient({ chainId, rpcUrls });
    const nonce = await publicClient.readContract({
      address: permit2Address,
      abi: Permit2Abi,
      functionName: erc20PermitFunctions.allowance,
      args: [account, token, spender],
    });

    const PERMIT2_DOMAIN_NAME = 'Permit2';
    const domain = {
      chainId,
      name: PERMIT2_DOMAIN_NAME,
      verifyingContract: permit2Address,
    };

    const permitApprove = {
      details: {
        token,
        amount,
        expiration,
        nonce: nonce[2],
      },
      spender,
      sigDeadline,
    };
    const types = {
      PermitSingle: [
        { name: 'details', type: 'PermitDetails' },
        { name: 'spender', type: 'address' },
        { name: 'sigDeadline', type: 'uint256' },
      ],
      PermitDetails: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint160' },
        { name: 'expiration', type: 'uint48' },
        { name: 'nonce', type: 'uint48' },
      ],
    };
    const values = permitApprove;

    const signature = await signTypedData({
      signer,
      domain,
      message: values,
      types,
      account,
      primaryType: 'PermitSingle',
    });
    const customPermitDataForTransfer =
      contractVersion === ContractVersion.v1 || service === Services.zap
        ? encodeAbiParameters(parseAbiParameters('uint160 allowanceAmount, uint48 nonce, uint48 expiration, uint256 sigDeadline, bytes signature'), [
            BigInt(permitApprove.details.amount.toString()),
            Number(permitApprove.details.nonce.toString()),
            Number(permitApprove.details.expiration.toString()),
            BigInt(permitApprove.sigDeadline.toString()),
            signature,
          ])
        : encodeAbiParameters(parseAbiParameters('uint48 nonce, uint48 expiration, uint256 sigDeadline, bytes signature'), [
            Number(permitApprove.details.nonce.toString()),
            Number(permitApprove.details.expiration.toString()),
            BigInt(permitApprove.sigDeadline.toString()),
            signature,
          ]);

    const permitType =
      service === Services.zap
        ? ZapPermitType.PERMIT2
        : contractVersion === ContractVersion.v1
          ? PermitType.PERMIT2_APPROVE
          : DZapPermitMode.PERMIT2_APPROVE;

    const permitData = encodeAbiParameters(parseAbiParameters('uint8, bytes'), [permitType, customPermitDataForTransfer]);

    return { status: TxnStatus.success, permitData, code: StatusCodes.Success };
  } catch (e: any) {
    if (e?.cause?.code === StatusCodes.UserRejectedRequest || e?.code === StatusCodes.UserRejectedRequest) {
      return { status: TxnStatus.rejected, code: StatusCodes.UserRejectedRequest, permitdata: null };
    }
    return { status: TxnStatus.error, code: e.code, permitData: null };
  }
}
