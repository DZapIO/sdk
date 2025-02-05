import { Erc20PermitFunctions, PermitType, StatusCodes, TxnStatus } from 'src/enums';
import { HexString } from 'src/types';
import { WalletClient, decodeAbiParameters, encodeAbiParameters, erc20Abi, parseAbiParameters } from 'viem';
import { readContract } from '../index';
import { PermitValidationResult } from 'src/types/permit';
import { SignatureExpiryInSecs } from 'src/constants/permit2';

function parseSignature(signature: HexString) {
  const r = signature.slice(0, 66) as HexString;
  const s = ('0x' + signature.slice(66, 130)) as HexString;
  const v = parseInt(signature.slice(130, 132), 16);
  return { r, s, v };
}

export async function getPermit1DataForApprove({
  chainId,
  account,
  token,
  spender,
  amount,
  signer,
  deadline = BigInt((SignatureExpiryInSecs + Math.floor(Date.now() / 1000)).toString()),
  rpcUrls,
}: {
  chainId: number;
  account: string;
  token: string;
  spender: string;
  amount: bigint;
  signer: WalletClient;
  deadline?: bigint;
  rpcUrls: string[];
}) {
  try {
    const nonceRes = await readContract({
      chainId,
      contractAddress: token as HexString,
      abi: erc20Abi,
      functionName: Erc20PermitFunctions.nonces,
      args: [account],
      rpcUrls,
    });

    if (nonceRes.code !== StatusCodes.Success) {
      return { status: TxnStatus.error, code: nonceRes.code, permitData: null };
    }

    const nonce = nonceRes.data as bigint;

    const [nameRes, versionRes] = await Promise.all([
      readContract({
        chainId,
        contractAddress: token as HexString,
        abi: erc20Abi,
        functionName: 'name',
        args: [],
        rpcUrls,
      }),
      readContract({
        chainId,
        contractAddress: token as HexString,
        abi: erc20Abi,
        functionName: 'version',
        args: [],
        rpcUrls,
      }),
    ]);

    const domain = {
      name: nameRes.data as string,
      version: (versionRes.code === StatusCodes.Success ? versionRes.data : '1') as string,
      chainId,
      verifyingContract: token as HexString,
    };

    const permit = {
      owner: account as HexString,
      spender: spender as HexString,
      value: amount,
      nonce,
      deadline,
    };

    const types = {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    };

    const signature = await signer.signTypedData({
      account: account as HexString,
      domain,
      message: permit,
      primaryType: 'Permit',
      types,
    });

    const { r, s, v } = parseSignature(signature);

    const permitData = encodeAbiParameters(
      parseAbiParameters('address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s'),
      [account as HexString, spender as HexString, amount, deadline, v, r as HexString, s as HexString],
    );

    const finalPermitData = encodeAbiParameters(parseAbiParameters('uint8 permitType, bytes data'), [PermitType.PERMIT, permitData]);

    return { status: TxnStatus.success, code: StatusCodes.Success, permitData: finalPermitData };
  } catch (error: unknown) {
    console.error('Error getting permit1 data:', error);
    const e = error as { code: StatusCodes };
    return { status: TxnStatus.error, code: e.code, permitData: null };
  }
}

export async function validatePermit1Data({
  permitData,
  srcToken,
  amount,
  account,
  chainId,
  rpcUrls,
}: {
  permitData: HexString;
  srcToken: string;
  amount: bigint;
  account: HexString;
  chainId: number;
  rpcUrls: string[];
}): Promise<PermitValidationResult> {
  try {
    const [owner, , , value, deadline, , ,] = decodeAbiParameters(
      parseAbiParameters('address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s'),
      permitData,
    );

    const nonceRes = await readContract({
      chainId,
      contractAddress: srcToken as HexString,
      abi: erc20Abi,
      functionName: Erc20PermitFunctions.nonces,
      args: [owner],
      rpcUrls,
    });

    if (nonceRes.code !== StatusCodes.Success) {
      return {
        isValid: false,
      };
    }

    const currentNonce = nonceRes.data as bigint;
    const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));

    const isValid = owner.toLowerCase() === account.toLowerCase() && value >= amount && BigInt(deadline) > currentTimestamp;

    return {
      isValid,
      details: {
        nonce: currentNonce,
        currentNonce,
        expiration: BigInt(deadline),
        sigDeadline: BigInt(deadline),
      },
    };
  } catch (error: unknown) {
    console.error('Error validating permit1 data:', error);
    return {
      isValid: false,
    };
  }
}
