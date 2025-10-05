import { ethers } from 'ethers';
import { abi as erc20PermitAbi } from 'src/artifacts/ERC20Permit';
import { Services } from 'src/constants';
import { erc20Functions } from 'src/constants/erc20';
import { DEFAULT_PERMIT_VERSION, SignatureExpiryInSecs } from 'src/constants/permit2';
import { ContractVersion, DZapPermitMode, StatusCodes, TxnStatus } from 'src/enums';
import { HexString, TokenPermitData } from 'src/types';
import { EIP2612DefaultTypes } from 'src/types/eip-2612';
import { DefaultPermit2612Params } from 'src/types/permit';
import { encodeAbiParameters, maxUint256, parseAbiParameters } from 'viem';
import { katana } from 'viem/chains';
import { generateDeadline } from '../date';
import { multicall } from '../multicall';
import { signTypedData } from '../signTypedData';

export const eip2612DisabledChains = [Number(katana.id)];
/**
 * Check if a token supports EIP-2612 permits by checking for required functions
 */
export const checkEIP2612PermitSupport = async ({
  address,
  chainId,
  rpcUrls,
  owner,
  permit,
}: {
  chainId: number;
  address: HexString;
  rpcUrls?: string[];
  owner: HexString; // Optional owner for fetching nonce
  permit?: TokenPermitData;
}): Promise<{
  supportsPermit: boolean;
  data?: {
    version: string;
    name: string;
    nonce: bigint;
  };
}> => {
  if (permit?.eip2612?.supported === false || eip2612DisabledChains.includes(chainId)) {
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
export const getEIP2612PermitSignature = async (
  params: DefaultPermit2612Params,
): Promise<{ status: TxnStatus; code: StatusCodes; permitData?: HexString }> => {
  try {
    const {
      chainId,
      spender,
      account,
      token,
      signer,
      contractVersion,
      service,
      name,
      nonce,
      version,
      deadline = generateDeadline(SignatureExpiryInSecs),
    } = params;
    const { address, amount = maxUint256 } = token;

    const domain = token?.permit?.eip2612?.data?.domain
      ? token?.permit?.eip2612?.data?.domain
      : {
          name,
          version,
          chainId,
          verifyingContract: address,
        };

    const message = {
      owner: account,
      spender,
      value: BigInt(amount),
      nonce,
      deadline,
    };

    const types = EIP2612DefaultTypes;
    const signature = await signTypedData({
      signer,
      domain,
      message,
      types,
      account,
      primaryType: 'Permit',
    });

    const sig = ethers.utils.splitSignature(signature);

    const dZapPermitData =
      contractVersion === ContractVersion.v1 && service !== Services.zap
        ? ethers.utils.defaultAbiCoder.encode(
            ['address', 'address', 'uint256', 'uint256', 'uint8', 'bytes32', 'bytes32'],
            [account, spender, amount, deadline, sig.v, sig.r, sig.s],
          )
        : ethers.utils.defaultAbiCoder.encode(['uint256', 'uint8', 'bytes32', 'bytes32'], [deadline, sig.v, sig.r, sig.s]);

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
