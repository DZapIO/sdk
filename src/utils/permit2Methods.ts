import { PERMIT2_ADDRESS } from 'src/constants';
import { ConnectorType, Erc20Functions, Erc20PermitFunctions, PermitType, StatusCodes, TxnStatus } from 'src/enums';
import { HexString } from 'src/types';
import { Abi, encodeAbiParameters, erc20Abi, maxUint256, parseAbiParameters } from 'viem';
import { getWalletClient, readContract, writeContract } from './index';
import { MaxAllowanceExpiration, MaxAllowanceTransferAmount, MaxSigDeadline } from '@uniswap/permit2-sdk';
import { abi as Permit2Abi } from '../artifacts/Permit2';

export const checkPermit2 = async ({
  srcToken,
  userAddress,
  chainId,
  rpcProvider,
  amount,
  connectorType,
  wcProjectId,
  afterPermit2ApprovalTxnCallback,
}: {
  srcToken: string;
  dzapContractAddress: HexString;
  userAddress: string;
  chainId: number;
  rpcProvider: string;
  amount: string;
  connectorType: ConnectorType;
  wcProjectId: string;
  afterPermit2ApprovalTxnCallback?: ({ txnHash }: { txnHash: HexString }) => Promise<void>;
}) => {
  try {
    console.log('checking with permit2');
    const permitAllowance = (await readContract({
      chainId,
      contractAddress: srcToken as HexString,
      abi: erc20Abi,
      functionName: Erc20Functions.allowance,
      args: [userAddress, PERMIT2_ADDRESS],
      rpcProvider,
    })) as bigint;
    if (permitAllowance < BigInt(amount)) {
      const txnDetails = await writeContract({
        chainId,
        contractAddress: srcToken as HexString,
        abi: erc20Abi,
        functionName: Erc20Functions.approve,
        args: [PERMIT2_ADDRESS, maxUint256],
        userAddress: userAddress as HexString,
        rpcProvider,
        connectorType,
        wcProjectId,
      });
      if (txnDetails.status !== TxnStatus.success) {
        return {
          status: txnDetails.status,
          code: txnDetails?.code || StatusCodes.FunctionNotFound,
        };
      }
      await afterPermit2ApprovalTxnCallback({ txnHash: txnDetails.txnHash });
    }
    return { status: TxnStatus.success, code: StatusCodes.Success };
  } catch (e) {
    console.log({ e });
    if (e?.cause?.code === StatusCodes.UserRejectedRequest || e?.code === StatusCodes.UserRejectedRequest) {
      return { status: TxnStatus.rejected, errorCode: StatusCodes.UserRejectedRequest };
    }
    return { status: TxnStatus.error, code: e.code };
  }
};

export async function getPermit2PermitDataForApprove({
  chainId,
  dzapContractAddress,
  account,
  token,
  connectorType,
  wcProjectId,
  rpcProvider,
  amount = BigInt(MaxAllowanceTransferAmount.toString()),
  sigDeadline = BigInt(MaxSigDeadline.toString()),
  expiration = BigInt(MaxAllowanceExpiration.toString()),
}: {
  chainId: number;
  account: string;
  token: string;
  dzapContractAddress: string;
  wcProjectId: string;
  connectorType: ConnectorType;
  rpcProvider: string;
  sigDeadline?: bigint;
  amount?: bigint;
  expiration?: bigint;
}) {
  try {
    const nonce = await readContract({
      chainId,
      contractAddress: PERMIT2_ADDRESS as HexString,
      abi: Permit2Abi as Abi,
      functionName: Erc20PermitFunctions.allowance,
      args: [account, token, dzapContractAddress],
      rpcProvider,
    });
    const PERMIT2_DOMAIN_NAME = 'Permit2';
    const domain = { chainId, name: PERMIT2_DOMAIN_NAME, verifyingContract: PERMIT2_ADDRESS as `0x${string}` };

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
    const walletClient = await getWalletClient({ chainId, account: account as HexString, connectorType: connectorType, wcProjectId });
    const signature = await walletClient.signTypedData({
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
    console.log({ e });
    if (e?.cause?.code === StatusCodes.UserRejectedRequest || e?.code === StatusCodes.UserRejectedRequest) {
      return { status: TxnStatus.rejected, errorCode: StatusCodes.UserRejectedRequest, permitdata: null };
    }
    return { status: TxnStatus.error, code: e.code, permitData: null };
  }
}
