import { ethers, Signer } from 'ethers';
import { abi as erc20PermitAbi } from 'src/artifacts/ERC20Permit';
import { zeroAddress } from 'src/constants/address';
import { SignatureExpiryInSecs } from 'src/constants/permit2';
import { DZapPermitMode, StatusCodes, TxnStatus } from 'src/enums';
import { HexString } from 'src/types';
import { EIP2612Types } from 'src/types/eip-2612';
import { encodeAbiParameters, getContract, maxUint256, parseAbiParameters, WalletClient } from 'viem';
import { generateDeadline } from '../date';
import { getPublicClient } from '../index';
import { signTypedData } from '../signTypedData';

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
  const contract = getContract({
    abi: erc20PermitAbi,
    address: address,
    client: getPublicClient({ chainId, rpcUrls }),
  });
  const [domainSeparatorResult, nonceResult, versionResult] = await Promise.allSettled([
    contract.read.DOMAIN_SEPARATOR(),
    contract.read.nonces([zeroAddress]), // dummy address to check function exists
    contract.read.version(),
  ]);

  if (domainSeparatorResult.status === 'rejected' || nonceResult.status === 'rejected') {
    return { supportsPermit: false };
  }

  const domainSeparator = domainSeparatorResult.value;
  const version = versionResult.status === 'fulfilled' ? versionResult.value : undefined; // sending undefined if version is not available

  return {
    supportsPermit: false,
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

    const contract = getContract({
      abi: erc20PermitAbi,
      address: address,
      client: getPublicClient({ chainId, rpcUrls }),
    });

    const [tokenNameResult, nonceResult] = await Promise.allSettled([contract.read.name(), contract.read.nonces([owner])]);

    if (tokenNameResult.status === 'rejected' || nonceResult.status === 'rejected') {
      return {
        status: TxnStatus.error,
        code: StatusCodes.Error,
      };
    }
    const name = tokenNameResult.value;
    const nonce = nonceResult.value;

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

    const dZapPermitData = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint8', 'bytes32', 'bytes32'], [deadline, sig.v, sig.r, sig.s]);

    const permitData = encodeAbiParameters(parseAbiParameters('uint8, bytes'), [DZapPermitMode.PERMIT, dZapPermitData as HexString]);

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
