import { ethers, Signer } from 'ethers';
import { encodeAbiParameters, maxUint256, parseAbiParameters, WalletClient } from 'viem';
import { erc20PermitAbi } from '../../artifacts/ERC20Permit';
import { Services } from '../../constants';
import { erc20Functions } from '../../constants/erc20';
import { DEFAULT_PERMIT_VERSION, SignatureExpiryInSecs } from '../../constants/permit2';
import { config } from '../../config';
import { ContractVersion, PermitType, StatusCodes, TxnStatus } from '../../enums';
import { AvailableDZapServices, HexString } from '../../types';
import { EIP2612Types } from '../../types/eip-2612';
import { generateDeadline } from '../date';
import { multicall } from '../multicall';
import { signTypedData } from '../signTypedData';

export const eip2612DisabledChains = config.getEip2612DisabledChains();
/**
 * Check if a token supports EIP-2612 permits by checking for required functions
 */
export const checkEIP2612PermitSupport = async ({
  address,
  chainId,
  rpcUrls,
  permitEIP2612DisabledTokens,
  owner,
}: {
  address: HexString;
  chainId: number;
  rpcUrls?: string[];
  permitEIP2612DisabledTokens?: string[];
  owner: HexString; // Optional owner for fetching nonce
}): Promise<{
  supportsPermit: boolean;
  data?: {
    version: string;
    name: string;
    nonce: bigint;
  };
}> => {
  if (permitEIP2612DisabledTokens?.some((token) => token.toLowerCase() === address.toLowerCase()) || eip2612DisabledChains.includes(chainId)) {
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
      args: [owner],
    },
    {
      address: address as HexString,
      abi: erc20PermitAbi,
      functionName: erc20Functions.version,
    },
    {
      address: address as HexString,
      abi: erc20PermitAbi,
      functionName: erc20Functions.name,
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

  const results = multicallResult.data as Array<{ status: string; result: unknown }>;
  const [domainSeparatorResult, nonceResult, versionResult, nameResult] = results;

  if (domainSeparatorResult.status !== TxnStatus.success || nonceResult.status !== TxnStatus.success || nameResult.status !== TxnStatus.success) {
    return { supportsPermit: false };
  }

  const name = nameResult.result as string;
  const nonce = nonceResult.result as bigint;
  const version = versionResult.status === TxnStatus.success ? (versionResult.result as string) : DEFAULT_PERMIT_VERSION;

  return {
    supportsPermit: true,
    data: {
      version,
      name,
      nonce,
    },
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
  amount = maxUint256,
  sigDeadline = generateDeadline(SignatureExpiryInSecs),
  contractVersion,
  service,
  name,
  nonce,
}: {
  chainId: number;
  account: HexString;
  token: HexString;
  spender: HexString;
  version: string;
  sigDeadline?: bigint;
  amount?: bigint;
  signer: WalletClient | Signer;
  contractVersion: ContractVersion;
  service: AvailableDZapServices;
  name: string;
  nonce: bigint;
}): Promise<{ status: TxnStatus; code: StatusCodes; permitData?: HexString }> => {
  try {
    const address = token as HexString;
    const owner = account as HexString;
    const deadline = sigDeadline;

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

    const data =
      contractVersion === ContractVersion.v1 && service !== Services.zap
        ? ethers.utils.defaultAbiCoder.encode(
            ['address', 'address', 'uint256', 'uint256', 'uint8', 'bytes32', 'bytes32'],
            [owner, spender, amount, deadline, sig.v, sig.r, sig.s],
          )
        : ethers.utils.defaultAbiCoder.encode(['uint256', 'uint8', 'bytes32', 'bytes32'], [deadline, sig.v, sig.r, sig.s]);

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
