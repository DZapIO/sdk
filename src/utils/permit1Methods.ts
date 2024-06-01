import { MaxSigDeadline } from '@uniswap/permit2-sdk';
import { PERMIT_TYPEHASH_CONST } from 'src/constants';
import { ConnectorType, Erc20Functions, Erc20PermitFunctions, PermitType, StatusCodes, TxnStatus } from 'src/enums';
import { HexString } from 'src/types';
import { Abi, encodeAbiParameters, erc20Abi, hexToNumber, parseAbiParameters, slice } from 'viem';
import { abi as PermitAbi } from '../artifacts/ERC20Permit';
import { getWalletClient, readContract } from './index';

export const checkPermit1 = async ({
  srcToken,
  chainId,
  rpcProvider,
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
  console.log('checking with permit1');
  try {
    const PERMIT_TYPEHASH = (await readContract({
      contractAddress: srcToken as HexString,
      abi: PermitAbi as Abi,
      functionName: Erc20PermitFunctions.PERMIT_TYPEHASH,
      chainId,
      rpcProvider,
    })) as string;
    if (PERMIT_TYPEHASH.toLowerCase() === PERMIT_TYPEHASH_CONST.toLowerCase()) {
      // eip712 type hash
      return { status: TxnStatus.success, code: StatusCodes.Success };
    }
    return { status: TxnStatus.checkOtherPermit, code: StatusCodes.FunctionNotFound };
  } catch (e) {
    console.log({ e });
    return { status: TxnStatus.checkOtherPermit, code: StatusCodes.FunctionNotFound };
  }
};

export const getPermit1PermitData = async ({
  chainId,
  account,
  token,
  dzapContractAddress,
  amount,
  connectorType,
  wcProjectId,
  rpcProvider,
}: {
  chainId: number;
  account: HexString;
  token: HexString;
  amount: string;
  connectorType: ConnectorType;
  wcProjectId: string;
  rpcProvider: string;
  dzapContractAddress: HexString;
}) => {
  try {
    const name = (await readContract({
      chainId,
      contractAddress: token as HexString,
      abi: erc20Abi,
      functionName: Erc20Functions.name,
      rpcProvider,
    })) as string;
    const userNonce = (await readContract({
      chainId,
      contractAddress: token,
      abi: PermitAbi as Abi,
      functionName: Erc20PermitFunctions.nonces,
      rpcProvider,
      args: [account],
    })) as string;
    let version: string;
    try {
      version = (await readContract({
        chainId,
        contractAddress: token,
        abi: PermitAbi as Abi,
        functionName: Erc20PermitFunctions.version,
        rpcProvider,
      })) as string;
    } catch (e) {
      console.log({ e });
      version = '1';
    }
    const domain = { name: name, version: version, chainId, verifyingContract: token };
    const types = {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    };
    const value = {
      owner: account,
      spender: dzapContractAddress,
      value: BigInt(amount),
      nonce: userNonce,
      deadline: BigInt(MaxSigDeadline.toString()),
    };

    const walletClient = await getWalletClient({ chainId, account, connectorType, wcProjectId });
    const signature = await walletClient.signTypedData({
      account: account,
      domain,
      types,
      primaryType: 'Permit',
      message: value,
    });

    const [r, s, v] = [slice(signature, 0, 32), slice(signature, 32, 64), hexToNumber(slice(signature, 64, 65))];
    const signatureData = encodeAbiParameters(parseAbiParameters('address, address, uint256, uint256, uint8, bytes32, bytes32'), [
      account,
      dzapContractAddress,
      BigInt(amount),
      BigInt(MaxSigDeadline.toString()),
      v,
      r,
      s,
    ]);
    const permitData = encodeAbiParameters(parseAbiParameters('uint8, bytes'), [PermitType.PERMIT, signatureData]);
    return { permitData, status: TxnStatus.success, code: StatusCodes.Success };
  } catch (e: any) {
    console.log({ e });
    if (e?.cause?.code === StatusCodes.UserRejectedRequest || e?.code === StatusCodes.UserRejectedRequest) {
      return { status: TxnStatus.rejected, code: StatusCodes.UserRejectedRequest, permitData: null };
    }
    return { status: TxnStatus.error, code: StatusCodes.Error, permitData: null };
  }
};
