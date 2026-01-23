import { ethers } from 'ethers';
import type { TypedDataDomain } from 'viem';
import { encodeAbiParameters, maxUint256, parseAbiParameters } from 'viem';

import { erc20PermitAbi } from '../../../artifacts';
import { config } from '../../../config';
import { Services } from '../../../constants';
import { ERC20_FUNCTIONS } from '../../../constants/erc20';
import { DEFAULT_PERMIT_VERSION, SIGNATURE_EXPIRY_IN_SECS } from '../../../constants/permit';
import { ContractVersion, DZapPermitMode, StatusCodes, TxnStatus } from '../../../enums';
import type { AvailableDZapServices, HexString, TokenPermitData } from '../../../types';
import { generateDeadline } from '../../../utils/date';
import { logger } from '../../../utils/logger';
import { multicall } from '../../../utils/multicall';
import { signTypedData } from '../../../utils/signer';
import type { DefaultPermit2612Params } from './types';
import { EIP2612DefaultTypes, type EIP2612Types } from './types';

/**
 * EIP2612 - Static class for handling EIP-2612 permit signature generation
 * This service provides methods for generating and encoding EIP-2612 signatures used for token approvals
 */
export class EIP2612 {
  private static permitSupportCache = new Map<string, boolean>();

  private static getEIP2612SupportCacheKey(chainId: number, address: HexString): string {
    return `${chainId}-${address.toLowerCase()}`;
  }

  /**
   * Generates a complete EIP-2612 permit signature with encoded data ready for transaction
   * @param params - EIP-2612 permit parameters including token, spender, and chain info
   * @returns Promise resolving to permit response with signature and encoded data
   */
  public static async generateSignature(params: DefaultPermit2612Params): Promise<{ status: TxnStatus; code: StatusCodes; permitData?: HexString }> {
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

      const domain = this.buildDomain(address, chainId, name, version, token?.permit?.eip2612?.data?.domain);
      const typedData = this.buildTypedData(account, spender, amount, nonce, deadline, domain);
      const signature = await signTypedData({
        signer,
        domain: typedData.domain,
        message: typedData.message,
        types: typedData.types,
        account,
        primaryType: 'Permit',
      });

      const permitData = this.encodePermitData({
        account,
        spender,
        amount,
        deadline,
        signature,
        contractVersion,
        service,
      });

      return {
        status: TxnStatus.success,
        code: StatusCodes.Success,
        permitData,
      };
    } catch (error: unknown) {
      const err = error as { cause?: { code?: StatusCodes }; code?: StatusCodes };
      logger.error('Error generating EIP-2612 permit signature', {
        service: 'EIP2612Service',
        method: 'generateSignature',
        chainId: params.chainId,
        tokenAddress: params.token.address,
        spender: params.spender,
        account: params.account,
        permitType: 'EIP2612Permit',
        error,
      });
      if (err?.cause?.code === StatusCodes.UserRejectedRequest || err?.code === StatusCodes.UserRejectedRequest) {
        return { status: TxnStatus.rejected, code: StatusCodes.UserRejectedRequest };
      }
      return { status: TxnStatus.error, code: StatusCodes.Error };
    }
  }

  /**
   * Builds the EIP-712 typed data structure for EIP-2612 permit
   * @param owner - Token owner address
   * @param spender - Spender address
   * @param value - Token amount
   * @param nonce - Token nonce
   * @param deadline - Permit deadline
   * @param domain - EIP-712 domain
   * @returns Typed data object ready for signing
   */
  public static buildTypedData(
    owner: HexString,
    spender: HexString,
    value: bigint,
    nonce: bigint,
    deadline: bigint,
    domain: TypedDataDomain,
  ): {
    domain: TypedDataDomain;
    types: EIP2612Types;
    message: {
      owner: HexString;
      spender: HexString;
      value: bigint;
      nonce: bigint;
      deadline: bigint;
    };
  } {
    return {
      domain,
      types: EIP2612DefaultTypes,
      message: {
        owner,
        spender,
        value,
        nonce,
        deadline,
      },
    };
  }

  /**
   * Builds the EIP-712 domain for EIP-2612 permit
   * @param address - Token contract address
   * @param chainId - Chain ID
   * @param name - Token name
   * @param version - Token version
   * @param customDomain - Optional custom domain override
   * @returns EIP-712 domain object
   */
  public static buildDomain(address: HexString, chainId: number, name: string, version: string, customDomain?: TypedDataDomain): TypedDataDomain {
    if (customDomain) {
      return customDomain;
    }

    return {
      name,
      version,
      chainId,
      verifyingContract: address,
    };
  }

  /**
   * Encodes permit data for contract execution
   * @param params - Parameters including signature and contract version
   * @returns Encoded permit data as hex string
   */
  public static encodePermitData({
    account,
    spender,
    amount,
    deadline,
    signature,
    contractVersion,
    service,
  }: {
    account: HexString;
    spender: HexString;
    amount: bigint;
    deadline: bigint;
    signature: HexString;
    contractVersion?: ContractVersion;
    service?: AvailableDZapServices;
  }): HexString {
    const sig = ethers.utils.splitSignature(signature);

    const dZapPermitData =
      contractVersion === ContractVersion.v1 && service !== Services.zap
        ? ethers.utils.defaultAbiCoder.encode(
            ['address', 'address', 'uint256', 'uint256', 'uint8', 'bytes32', 'bytes32'],
            [account, spender, amount, deadline, sig.v, sig.r, sig.s],
          )
        : ethers.utils.defaultAbiCoder.encode(['uint256', 'uint8', 'bytes32', 'bytes32'], [deadline, sig.v, sig.r, sig.s]);

    return encodeAbiParameters(parseAbiParameters('uint8, bytes'), [DZapPermitMode.PERMIT, dZapPermitData as HexString]);
  }

  /**
   * Checks common conditions for EIP-2612 permit support
   * Returns early support determination or null if further checks are needed
   * @param chainId - Chain ID
   * @param address - Token address
   * @param permit - Optional permit data
   * @returns Object with supportsPermit (boolean if determined, null if continue)
   */
  private static isSupported(chainId: number, address: HexString, permit?: TokenPermitData): boolean | null {
    if (config.eip2612DisabledChains.includes(chainId)) {
      return false;
    }

    if (permit?.eip2612 !== undefined) {
      return permit.eip2612.supported;
    }

    const cacheKey = this.getEIP2612SupportCacheKey(chainId, address);
    const cachedSupport = this.permitSupportCache.get(cacheKey);

    if (cachedSupport !== undefined) {
      return cachedSupport;
    }

    return null;
  }

  /**
   * Lightweight check if a token supports EIP-2612 permits
   * Optimized for allowance checks - only returns support status, no nonce data
   * Uses token.permit data if available, otherwise checks cache, then minimal RPC call
   */
  public static async checkEIP2612PermitSupport({
    address,
    chainId,
    rpcUrls,
    permit,
  }: {
    chainId: number;
    address: HexString;
    rpcUrls?: string[];
    permit?: TokenPermitData;
  }): Promise<{
    supportsPermit: boolean;
  }> {
    const supportCheck = this.isSupported(chainId, address, permit);

    // If we have a definitive answer (from config, permit data, or cache), return it
    if (supportCheck !== null) {
      return { supportsPermit: supportCheck };
    }

    const contracts = [
      {
        address: address as HexString,
        abi: erc20PermitAbi,
        functionName: ERC20_FUNCTIONS.domainSeparator,
      },
    ] as const;

    const multicallResult = await multicall({
      chainId,
      contracts,
      rpcUrls,
      allowFailure: true,
    });

    const results = multicallResult.data;
    const supportsPermit = multicallResult.status === TxnStatus.success && results.length > 0 && results[0]?.status === TxnStatus.success;
    this.permitSupportCache.set(this.getEIP2612SupportCacheKey(chainId, address), supportsPermit);

    return { supportsPermit };
  }

  /**
   * Get full EIP-2612 permit data including nonce, version, and name
   * Optimized for signature service - always fetches nonce via RPC
   * Uses caching to avoid redundant calls when called after allowance check
   */
  public static async getEIP2612PermitData({
    address,
    chainId,
    rpcUrls,
    owner,
    permit,
  }: {
    chainId: number;
    address: HexString;
    rpcUrls?: string[];
    owner: HexString;
    permit?: TokenPermitData;
  }): Promise<{
    supportsPermit: boolean;
    data?: {
      version: string;
      name: string;
      nonce: bigint;
    };
  }> {
    const supportCheck = this.isSupported(chainId, address, permit);

    if (supportCheck === false) {
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
        functionName: ERC20_FUNCTIONS.name,
      },
      {
        address: address as HexString,
        abi: erc20PermitAbi,
        functionName: ERC20_FUNCTIONS.version,
      },
    ] as const;

    const multicallResult = await multicall({
      chainId,
      contracts,
      rpcUrls,
      allowFailure: true,
    });

    if (multicallResult.status !== TxnStatus.success) {
      return { supportsPermit: false };
    }

    const [domainSeparatorResult, nonceResult, nameResult, versionResult] = multicallResult.data;

    if (domainSeparatorResult.status !== TxnStatus.success || nonceResult.status !== TxnStatus.success || nameResult.status !== TxnStatus.success) {
      return { supportsPermit: false };
    }

    const data: {
      version: string;
      name: string;
      nonce: bigint;
    } = {
      version: versionResult.status === TxnStatus.success ? (versionResult.result as string) : DEFAULT_PERMIT_VERSION,
      name: nameResult.result as string,
      nonce: nonceResult.result as bigint,
    };

    const supportCacheKey = this.getEIP2612SupportCacheKey(chainId, address);
    this.permitSupportCache.set(supportCacheKey, true);

    return {
      supportsPermit: true,
      data,
    };
  }
}
