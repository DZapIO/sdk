import { ethers } from 'ethers';
import { encodeAbiParameters, maxUint256, parseAbiParameters } from 'viem';
import { erc20PermitAbi } from '../../artifacts/ERC20Permit';
import { config } from '../../config';
import { Services } from '../../constants';
import { erc20Functions, erc20PermitFunctions } from '../../constants/erc20';
import { EIP2612_PERMIT_TYPEHASH, EIP712_ZERO_SALT } from '../../constants/permit';
import { DEFAULT_PERMIT_VERSION, SignatureExpiryInSecs } from '../../constants/permit2';
import { ContractVersion, DZapPermitMode, StatusCodes, TxnStatus } from '../../enums';
import { HexString, TokenPermitData } from '../../types';
import { EIP2612DefaultTypes } from '../../types/eip-2612';
import { DefaultPermit2612Params } from '../../types/permit';
import { generateDeadline } from '../date';
import { multicall } from '../multicall';
import { signTypedData } from '../signTypedData';

export const eip2612DisabledChains = config.getEip2612DisabledChains();

type MulticallSuccess<T> = { status: TxnStatus.success; result: T };
type MulticallFailure = { status: 'failure'; result: unknown };
type EIP2612SupportMulticallItem<T> = MulticallSuccess<T> | MulticallFailure;
type EIP712DomainResult = readonly [HexString, string, string, bigint, HexString, HexString, readonly bigint[]];
type EIP2612SupportMulticallData = [
  EIP2612SupportMulticallItem<EIP712DomainResult>,
  EIP2612SupportMulticallItem<string>,
  EIP2612SupportMulticallItem<bigint>,
  EIP2612SupportMulticallItem<string>,
  EIP2612SupportMulticallItem<string>,
  EIP2612SupportMulticallItem<string>,
];

const getEIP2612SupportMulticallResult = async ({
  address,
  owner,
  chainId,
  rpcUrls,
}: {
  address: HexString;
  owner: HexString;
  chainId: number;
  rpcUrls?: string[];
}) => {
  const contracts = [
    {
      address: address as HexString,
      abi: erc20PermitAbi,
      functionName: 'eip712Domain',
    },
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
      functionName: erc20Functions.name,
    },
    {
      address: address as HexString,
      abi: erc20PermitAbi,
      functionName: erc20Functions.version,
    },
    {
      address: address as HexString,
      abi: erc20PermitAbi,
      functionName: erc20PermitFunctions.PERMIT_TYPEHASH,
    },
  ];

  return multicall({
    chainId,
    contracts,
    rpcUrls,
    allowFailure: true,
  }).then((result) => ({
    ...result,
    data: result.data as EIP2612SupportMulticallData,
  }));
};

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
    salt?: HexString;
  };
}> => {
  if (permit?.eip2612?.supported === false || eip2612DisabledChains.includes(chainId)) {
    return { supportsPermit: false };
  }
  const multicallResult = await getEIP2612SupportMulticallResult({ address, owner, chainId, rpcUrls });

  if (multicallResult.status !== TxnStatus.success) {
    return { supportsPermit: false };
  }

  const [eip712DomainResult, domainSeparatorResult, nonceResult, nameResult, versionResult, permitTypeHashResult] = multicallResult.data;

  if (nonceResult.status !== TxnStatus.success || nameResult.status !== TxnStatus.success || domainSeparatorResult.status !== TxnStatus.success) {
    return { supportsPermit: false };
  }

  const nonce = nonceResult.result;

  const hasEip712Domain = eip712DomainResult.status === TxnStatus.success && Boolean(eip712DomainResult.result);

  if (permitTypeHashResult.status === TxnStatus.success && permitTypeHashResult.result.toLowerCase() !== EIP2612_PERMIT_TYPEHASH.toLowerCase()) {
    return { supportsPermit: false };
  }

  let name: string;
  let version: string;
  let salt: HexString | undefined;

  if (hasEip712Domain) {
    const [, eipName, eipVersion, eipChainId, verifyingContract, eipSalt] = eip712DomainResult.result;
    if (BigInt(chainId) !== eipChainId || verifyingContract.toLowerCase() !== address.toLowerCase()) {
      return { supportsPermit: false };
    }
    name = eipName;
    version = eipVersion;
    if (eipSalt && eipSalt.toLowerCase() !== EIP712_ZERO_SALT) {
      salt = eipSalt as HexString;
    }
  } else {
    name = nameResult.result;
    version = versionResult.status === TxnStatus.success ? versionResult.result : DEFAULT_PERMIT_VERSION;
  }

  return {
    supportsPermit: true,
    data: {
      version,
      name,
      nonce,
      ...(salt ? { salt } : {}),
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
      salt,
      deadline = generateDeadline(SignatureExpiryInSecs),
    } = params;

    const { address } = token;
    const amount = token.amount ? BigInt(token.amount) : maxUint256;
    // Prefer RPC-derived name/version (EIP-5267 eip712Domain); static token metadata domain can use the wrong EIP-712 `name` (e.g. AMM pools: name() is a label but domain name is "").
    const domain = {
      ...(token?.permit?.eip2612?.data?.domain ?? {}),
      name,
      version,
      chainId,
      verifyingContract: address,
      ...(salt ? { salt } : {}),
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
