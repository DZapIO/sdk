import { ethers } from 'ethers';
import { abi as erc20PermitAbi } from 'src/artifacts/ERC20Permit';
import { GaslessTxType } from 'src/constants';
import { zeroAddress } from 'src/constants/address';
import { DZAP_SALT } from 'src/constants/permit';
import { SignatureExpiryInSecs } from 'src/constants/permit2';
import { DZapPermitMode, StatusCodes, TxnStatus } from 'src/enums';
import { HexString } from 'src/types';
import { EIP2612BridgeTypes, EIP2612DefaultTypes, EIP2612SwapTypes } from 'src/types/eip-2612';
import { Permit2612Config } from 'src/types/permit';
import { encodeAbiParameters, getContract, maxUint256, parseAbiParameters } from 'viem';
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
export const getEIP2612PermitSignature = async (
  params: Permit2612Config,
): Promise<{ status: TxnStatus; code: StatusCodes; permitData?: HexString }> => {
  try {
    const { chainId, spender, account, token, signer, rpcUrls, version, gasless, deadline = generateDeadline(SignatureExpiryInSecs) } = params;
    const { address, amount = maxUint256 } = token;

    const contract = getContract({
      abi: erc20PermitAbi,
      address: address,
      client: getPublicClient({ chainId, rpcUrls }),
    });

    const [tokenNameResult, nonceResult] = await Promise.allSettled([contract.read.name(), contract.read.nonces([account])]);

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
      ...(gasless && { salt: DZAP_SALT }),
    };

    const message = gasless
      ? params.txType === GaslessTxType.swap
        ? {
            txId: params.txId,
            user: account,
            executorFeesHash: params.executorFeesHash,
            swapDataHash: params.swapDataHash,
            nonce,
            deadline,
          }
        : {
            txId: params.txId,
            user: account,
            nonce,
            deadline,
            executorFeesHash: params.executorFeesHash,
            swapDataHash: params.swapDataHash,
            adapterDataHash: params.adapterDataHash,
          }
      : {
          owner: account,
          spender,
          value: amount,
          nonce,
          deadline,
        };

    const types = gasless ? (params.txType === GaslessTxType.swap ? EIP2612SwapTypes : EIP2612BridgeTypes) : EIP2612DefaultTypes;
    const signature = await signTypedData({
      signer,
      domain,
      message,
      types,
      account,
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
