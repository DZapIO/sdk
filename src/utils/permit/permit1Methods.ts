import { PERMIT_TYPEHASH_CONST } from 'src/constants';
import { Erc20Functions, Erc20PermitFunctions, PermitType, StatusCodes, TxnStatus } from 'src/enums';
import { HexString } from 'src/types';
import { Abi, WalletClient, encodeAbiParameters, erc20Abi, hexToNumber, maxUint256, parseAbiParameters, slice } from 'viem';
import { abi as PermitAbi } from '../../artifacts/ERC20Permit';
import { readContract } from '../index';
import { MaxSigDeadline } from './permit2Methods';

export const checkPermit1 = async ({ srcToken, chainId, rpcUrls }: { srcToken: string; chainId: number; rpcUrls: string[] }) => {
  console.log('checking with permit1');

  const PERMIT_TYPEHASH_RES = await readContract({
    contractAddress: srcToken as HexString,
    abi: PermitAbi as Abi,
    functionName: Erc20PermitFunctions.PERMIT_TYPEHASH,
    chainId,
    rpcUrls,
  });
  if (!PERMIT_TYPEHASH_RES.data) {
    // eip712 type hash
    return {
      status: TxnStatus.checkOtherPermit,
      code: PERMIT_TYPEHASH_RES.code ?? StatusCodes.FunctionNotFound,
      data: { permitAllowance: BigInt(0) },
    };
  }
  const PERMIT_TYPEHASH = PERMIT_TYPEHASH_RES.data as string;
  if (PERMIT_TYPEHASH.toLowerCase() === PERMIT_TYPEHASH_CONST.toLowerCase())
    return { status: TxnStatus.success, code: StatusCodes.Success, data: { permitAllowance: maxUint256 } };
};

export const getPermit1PermitData = async ({
  chainId,
  account,
  token,
  dzapContractAddress,
  amount,
  signer,
  rpcUrls,
}: {
  chainId: number;
  account: HexString;
  token: HexString;
  amount: string;
  signer: WalletClient;
  rpcUrls?: string[];
  dzapContractAddress: HexString;
}) => {
  try {
    const tokenNameRes = await readContract({
      chainId,
      contractAddress: token as HexString,
      abi: erc20Abi,
      functionName: Erc20Functions.name,
      rpcUrls,
    });
    if (tokenNameRes.code !== StatusCodes.Success) {
      return { permitData: null, status: tokenNameRes.status, code: tokenNameRes.code };
    }
    const tokenName = tokenNameRes.data as string;
    const userNonceRes = await readContract({
      chainId,
      contractAddress: token,
      abi: PermitAbi as Abi,
      functionName: Erc20PermitFunctions.nonces,
      rpcUrls,
      args: [account],
    });
    if (userNonceRes.code !== StatusCodes.Success) {
      return { permitData: null, status: userNonceRes.status, code: userNonceRes.code };
    }
    const userNonce = userNonceRes.data as string;
    const versionRes = await readContract({
      chainId,
      contractAddress: token,
      abi: PermitAbi as Abi,
      functionName: Erc20PermitFunctions.version,
      rpcUrls,
    });
    const version = (versionRes.data as string) ?? '1';

    const domain = { name: tokenName, version: version, chainId, verifyingContract: token };
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

    const signature = await signer.signTypedData({
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
