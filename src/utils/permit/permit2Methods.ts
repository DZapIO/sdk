import { PERMIT2_ADDRESS } from 'src/constants';
import { Erc20Functions, Erc20PermitFunctions, PermitType, StatusCodes, TxnStatus } from 'src/enums';
import { HexString } from 'src/types';
import { Abi, WalletClient, encodeAbiParameters, erc20Abi, maxUint48, parseAbiParameters } from 'viem';
import { abi as Permit2Abi } from '../../artifacts/Permit2';
import { readContract } from '../index';

export const MaxAllowanceTransferAmount = maxUint48;
export const MaxAllowanceExpiration = maxUint48;
export const MaxSigDeadline = maxUint48;

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
    console.log('checking with permit2');
    const permitAllowanceRes = await readContract({
      chainId,
      contractAddress: srcToken as HexString,
      abi: erc20Abi,
      functionName: Erc20Functions.allowance,
      args: [userAddress, PERMIT2_ADDRESS],
      rpcUrls,
    });
    if (permitAllowanceRes.code !== StatusCodes.Success) {
      return { status: TxnStatus.error, code: StatusCodes.Error, data: { permitAllowance: BigInt(0) } };
    }
    return { status: TxnStatus.success, code: StatusCodes.Success, data: { permitAllowance: permitAllowanceRes.data as bigint } };
  } catch (e) {
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
  account,
  token,
  signer,
  rpcUrls,
  amount = BigInt(MaxAllowanceTransferAmount.toString()),
  sigDeadline = BigInt(MaxSigDeadline.toString()),
  expiration = BigInt(MaxAllowanceExpiration.toString()),
}: {
  chainId: number;
  account: string;
  token: string;
  dzapContractAddress: string;
  rpcUrls?: string[];
  sigDeadline?: bigint;
  amount?: bigint;
  signer: WalletClient;
  expiration?: bigint;
}) {
  try {
    const nonceRes = await readContract({
      chainId,
      contractAddress: PERMIT2_ADDRESS as HexString,
      abi: Permit2Abi as Abi,
      functionName: Erc20PermitFunctions.allowance,
      args: [account, token, dzapContractAddress],
      rpcUrls,
    });
    if (nonceRes.code !== StatusCodes.Success) {
      return { status: nonceRes.status, code: nonceRes, permitData: null };
    }
    const nonce = nonceRes.data as bigint;
    const PERMIT2_DOMAIN_NAME = 'Permit2';
    const domain = { chainId, name: PERMIT2_DOMAIN_NAME, verifyingContract: PERMIT2_ADDRESS as HexString };

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
    const permitData = encodeAbiParameters(parseAbiParameters('uint8, bytes'), [PermitType.PERMIT2_APPROVE, customPermitDataForTransfer]);
    return { status: TxnStatus.success, permitData, code: StatusCodes.Success };
  } catch (e) {
    if (e?.cause?.code === StatusCodes.UserRejectedRequest || e?.code === StatusCodes.UserRejectedRequest) {
      return { status: TxnStatus.rejected, errorCode: StatusCodes.UserRejectedRequest, permitdata: null };
    }
    return { status: TxnStatus.error, code: e.code, permitData: null };
  }
}
