import { ethers, Signer } from 'ethers';
import { abi as erc20PermitAbi } from 'src/artifacts/ERC20Permit';
import { zeroAddress } from 'src/constants/address';
import { SignatureExpiryInSecs } from 'src/constants/permit2';
import { PermitType, StatusCodes, TxnStatus } from 'src/enums';
import { HexString } from 'src/types';
import { EIP2612Types } from 'src/types/eip-2612';
import { encodeAbiParameters, maxUint256, parseAbiParameters, WalletClient } from 'viem';
import { generateDeadline } from '../date';
import { multicall } from '../multicall';
import { signTypedData } from '../signTypedData';
import { erc20Functions } from 'src/constants/erc20';

/**
 * Check if a token supports EIP-2612 permits by checking for required functions
 */
export const checkEIP2612PermitSupport = async ({
  address,
  chainId,
  rpcUrls,
  permitEIP2612DisabledTokens,
}: {
  address: HexString;
  chainId: number;
  rpcUrls?: string[];
  permitEIP2612DisabledTokens?: string[];
}): Promise<{ supportsPermit: boolean; domainSeparator?: HexString; version?: string }> => {
  if (permitEIP2612DisabledTokens?.some((token) => token.toLowerCase() === address.toLowerCase())) {
    return { supportsPermit: false };
  }

  const contracts = [
    {
      address: address as HexString,
      abi: erc20PermitAbi,
      functionName: erc20Functions.domainSeparator,
    },
    {
      address: address as HexString,
      abi: erc20PermitAbi,
      functionName: erc20Functions.nonces,
      args: [zeroAddress], // dummy address to check function exists
    },
    {
      address: address as HexString,
      abi: erc20PermitAbi,
      functionName: erc20Functions.version,
    },
  ];

  const multicallResult = await multicall({
    chainId,
    contracts,
    rpcUrls,
    allowFailure: true,
  });

  if (multicallResult.status !== TxnStatus.success) {
    return { supportsPermit: false };
  }
  const [domainSeparatorResult, nonceResult, versionResult] = multicallResult.data as Array<{ status: string; result: unknown }>;
  if (domainSeparatorResult.status !== TxnStatus.success || nonceResult.status !== TxnStatus.success) {
    return { supportsPermit: false };
  }

  const domainSeparator = domainSeparatorResult.result as HexString;
  const version = versionResult.status === TxnStatus.success ? (versionResult.result as string) : undefined; // sending undefined if version is not available

  return {
    supportsPermit: true,
    domainSeparator,
    version,
  };
};

/**
 * Generate EIP-2612 permit signature
 */
export const getEIP2612PermitSignature = async ({
  chainId,
  spender,
  account,
  token,
  signer,
  version,
  rpcUrls,
  amount = maxUint256,
  sigDeadline = generateDeadline(SignatureExpiryInSecs),
}: {
  chainId: number;
  account: HexString;
  token: HexString;
  spender: HexString;
  version: string;
  rpcUrls?: string[];
  sigDeadline?: bigint;
  amount?: bigint;
  signer: WalletClient | Signer;
}): Promise<{ status: TxnStatus; code: StatusCodes; permitData?: HexString }> => {
  try {
    const address = token as HexString;
    const owner = account as HexString;
    const deadline = sigDeadline;

    const contracts = [
      {
        address: address as HexString,
        abi: erc20PermitAbi,
        functionName: erc20Functions.name,
      },
      {
        address: address as HexString,
        abi: erc20PermitAbi,
        functionName: erc20Functions.nonces,
        args: [owner],
      },
    ];

    const multicallResult = await multicall({
      chainId,
      contracts,
      rpcUrls,
      allowFailure: false,
    });

    if (multicallResult.status !== TxnStatus.success) {
      return {
        status: TxnStatus.error,
        code: StatusCodes.Error,
      };
    }
    const [tokenNameResult, nonceResult] = multicallResult.data;
    const name = tokenNameResult as string;
    const nonce = nonceResult as bigint;

    if (!name || Number.isNaN(Number(nonce))) {
      throw new Error('Failed to retrieve token name or nonce');
    }
    const domain = {
      name,
      version,
      chainId,
      verifyingContract: address,
    };

    const message = {
      owner,
      spender,
      value: amount,
      nonce,
      deadline,
    };

    const signature = await signTypedData({
      signer,
      domain,
      message,
      types: EIP2612Types,
      account: owner,
      primaryType: 'Permit',
    });

    const sig = ethers.utils.splitSignature(signature);

    const data = ethers.utils.defaultAbiCoder.encode(
      ['address', 'address', 'uint256', 'uint256', 'uint8', 'bytes32', 'bytes32'],
      [owner, spender, amount, deadline, sig.v, sig.r, sig.s],
    );

    const permitData = encodeAbiParameters(parseAbiParameters('uint8, bytes'), [PermitType.PERMIT, data as HexString]);

    return {
      status: TxnStatus.success,
      code: StatusCodes.Success,
      permitData,
    };
  } catch (error: any) {
    console.log('Error generating permit signature:', error);
    if (error?.cause?.code === StatusCodes.UserRejectedRequest || error?.code === StatusCodes.UserRejectedRequest) {
      return { status: TxnStatus.rejected, code: StatusCodes.UserRejectedRequest };
    }
    return { status: TxnStatus.error, code: StatusCodes.Error };
  }
};
