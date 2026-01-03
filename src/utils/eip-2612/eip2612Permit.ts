import { ethers } from 'ethers';
import { encodeAbiParameters, maxUint256, parseAbiParameters } from 'viem';
import { erc20PermitAbi } from '../../artifacts';
import { config } from '../../config';
import { Services } from '../../constants';
import { ERC20_FUNCTIONS } from '../../constants/erc20';
import { DEFAULT_PERMIT_VERSION, SIGNATURE_EXPIRY_IN_SECS } from '../../constants/permit';
import { ContractVersion, DZapPermitMode, StatusCodes, TxnStatus } from '../../enums';
import { HexString, TokenPermitData } from '../../types';
import { EIP2612DefaultTypes } from '../../types/eip-2612';
import { DefaultPermit2612Params } from '../../types/permit';
import { generateDeadline } from '../date';
import { multicall } from '../contract/multicall';
import { signTypedData } from '../signer';

export const eip2612DisabledChains = config.getEip2612DisabledChains();
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
      functionName: ERC20_FUNCTIONS.domainSeparator,
    },
    {
      address: address as HexString,
      abi: erc20PermitAbi,
      functionName: ERC20_FUNCTIONS.nonces,
      args: [owner],
    },
    {
      address: address as HexString,
      abi: erc20PermitAbi,
      functionName: ERC20_FUNCTIONS.version,
    },
    {
      address: address as HexString,
      abi: erc20PermitAbi,
      functionName: ERC20_FUNCTIONS.name,
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
      deadline = generateDeadline(SIGNATURE_EXPIRY_IN_SECS),
    } = params;

    const { address } = token;
    const amount = token.amount ? BigInt(token.amount) : maxUint256;
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
      value: amount,
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
