import { DEFAULT_PERMIT2_ADDRESS, exclusivePermit2Addresses } from 'src/constants/contract';
import { MaxAllowanceExpiration, MaxAllowanceTransferAmount, SignatureExpiryInSecs } from 'src/constants/permit2';
import { Erc20Functions, Erc20PermitFunctions, PermitType, StatusCodes, TxnStatus, ZapPermitType } from 'src/enums';
import { AvailableDZapServices, HexString } from 'src/types';
import { Abi, WalletClient, encodeAbiParameters, erc20Abi, parseAbiParameters } from 'viem';
import { abi as Permit2Abi } from '../../artifacts/Permit2';
import { readContract } from '../index';
import { Services } from 'src/constants';

export function getPermit2Address(chainId: number): HexString {
  return exclusivePermit2Addresses[chainId] ?? DEFAULT_PERMIT2_ADDRESS;
}

export const checkPermit2 = async ({
  srcToken,
  userAddress,
  chainId,
  rpcUrls,
}: {
  srcToken: string;
  userAddress: string;
  chainId: number;
  rpcUrls?: string[];
}) => {
  try {
    const permitAllowanceRes = await readContract({
      chainId,
      contractAddress: srcToken as HexString,
      abi: erc20Abi,
      functionName: Erc20Functions.allowance,
      args: [userAddress, getPermit2Address(chainId)],
      rpcUrls,
    });
    if (permitAllowanceRes.code !== StatusCodes.Success) {
      return { status: TxnStatus.error, code: StatusCodes.Error, data: { permitAllowance: BigInt(0) } };
    }
    return { status: TxnStatus.success, code: StatusCodes.Success, data: { permitAllowance: permitAllowanceRes.data as bigint } };
  } catch (e: any) {
    console.log({ e });
    if (e?.cause?.code === StatusCodes.UserRejectedRequest || e?.code === StatusCodes.UserRejectedRequest) {
      return { status: TxnStatus.rejected, code: StatusCodes.UserRejectedRequest, data: { permitAllowance: BigInt(0) } };
    }
    return { status: TxnStatus.error, code: e.code, data: { permitAllowance: BigInt(0) } };
  }
};

export async function getPermit2PermitDataForApprove({
  chainId,
  dzapContractAddress,
  service,
  account,
  token,
  signer,
  rpcUrls,
  amount = BigInt(MaxAllowanceTransferAmount.toString()),
  sigDeadline = BigInt((SignatureExpiryInSecs + Math.floor(Date.now() / 1000)).toString()),
  expiration = BigInt(MaxAllowanceExpiration.toString()),
}: {
  chainId: number;
  account: string;
  token: string;
  service: AvailableDZapServices;
  dzapContractAddress: string;
  rpcUrls?: string[];
  sigDeadline?: bigint;
  amount?: bigint;
  signer: WalletClient;
  expiration?: bigint;
}) {
  try {
    const permit2Address = getPermit2Address(chainId);
    const nonceRes = await readContract({
      chainId,
      contractAddress: permit2Address,
      abi: Permit2Abi as Abi,
      functionName: Erc20PermitFunctions.allowance,
      args: [account, token, dzapContractAddress],
      rpcUrls,
    });
    if (nonceRes.code !== StatusCodes.Success) {
      return { status: nonceRes.status, code: nonceRes.code, permitData: null };
    }
    const nonce = nonceRes.data as bigint[];
    const PERMIT2_DOMAIN_NAME = 'Permit2';
    const domain = { chainId, name: PERMIT2_DOMAIN_NAME, verifyingContract: permit2Address };

    const permitApprove = {
      details: {
        token,
        amount,
        expiration,
        nonce: nonce[2],
      },
      spender: dzapContractAddress,
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
    const signature = await signer.signTypedData({
      account: account as HexString,
      domain,
      message: values,
      primaryType: 'PermitSingle',
      types,
    });
    const customPermitDataForTransfer = encodeAbiParameters(
      parseAbiParameters('uint160 allowanceAmount, uint48 nonce, uint48 expiration, uint256 sigDeadline, bytes signature'),
      [
        BigInt(permitApprove.details.amount.toString()),
        Number(permitApprove.details.nonce.toString()),
        Number(permitApprove.details.expiration.toString()),
        BigInt(permitApprove.sigDeadline.toString()),
        signature,
      ],
    );
    const permitType = service === Services.zap ? ZapPermitType.PERMIT2 : PermitType.PERMIT2_APPROVE;
    const permitData = encodeAbiParameters(parseAbiParameters('uint8, bytes'), [permitType, customPermitDataForTransfer]);
    return { status: TxnStatus.success, permitData, code: StatusCodes.Success };
  } catch (e: any) {
    if (e?.cause?.code === StatusCodes.UserRejectedRequest || e?.code === StatusCodes.UserRejectedRequest) {
      return { status: TxnStatus.rejected, code: StatusCodes.UserRejectedRequest, permitdata: null };
    }
    return { status: TxnStatus.error, code: e.code, permitData: null };
  }
}
