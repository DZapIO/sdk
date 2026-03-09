import type { TypedDataField } from 'ethers';
import type { Address, TypedDataDomain } from 'viem';
import { encodeAbiParameters, maxUint48, maxUint256, parseAbiParameters } from 'viem';

import * as ABI from '../../../artifacts';
import { GASLESS_TX_TYPE } from '../../../constants';
import { Services } from '../../../constants';
import { ERC20_FUNCTIONS } from '../../../constants/erc20';
import { Permit2PrimaryTypes, PermitToDZapPermitMode, SIGNATURE_EXPIRY_IN_SECS } from '../../../constants/permit';
import { DEFAULT_PERMIT2_ADDRESS, exclusivePermit2Addresses } from '../../../constants/permit2';
import { ContractVersion, DZapV1PermitMode, StatusCodes, TxnStatus } from '../../../enums';
import type { AvailableDZapServices, HexString } from '../../../types';
import { generateDeadline } from '../../../utils';
import { NotFoundError, parseError, ValidationError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { getNextPermit2Nonce } from '../../../utils/nonce';
import { signTypedData } from '../../../utils/signer';
import { ChainsService } from '../../chains';
import type { BasePermitParams, BasePermitResponse } from '../types';
import type {
  Permit2Params,
  Permit2PrimaryType,
  PermitBatchTransferFromValues,
  PermitSingleValues,
  PermitTransferFromValues,
  TokenWithIndex,
  WitnessData,
} from './types';
import { BatchPermitAbiParams, bridgeGaslessWitnessType, defaultWitnessType, swapGaslessWitnessType } from './types';

const PERMIT2_DOMAIN_NAME = 'Permit2';

type PermitSingleData = {
  domain: TypedDataDomain;
  types: Record<string, Array<TypedDataField>>;
  message: PermitSingleValues;
};

type PermitTransferFromData = {
  domain: TypedDataDomain;
  types: Record<string, Array<TypedDataField>>;
  message: PermitTransferFromValues;
};

type PermitBatchTransferFromData = {
  domain: TypedDataDomain;
  types: Record<string, Array<TypedDataField>>;
  message: PermitBatchTransferFromValues;
};

type Permit2ValuesParams = {
  deadline: bigint;
  permit2Address: HexString;
  tokens: TokenWithIndex[];
  expiration?: bigint;
  firstTokenNonce: bigint | null;
  primaryType: Permit2PrimaryType;
} & Omit<BasePermitParams, 'deadline' | 'signer'>;

/**
 * Permit2 - Static class for handling Permit2 signature generation and management
 * This service provides methods for generating and encoding Permit2 signatures used in gasless transactions
 */
export class Permit2 {
  /**
   * Gets the Permit2 contract address for the specified chain
   * @param chainId - The blockchain network ID
   * @returns The Permit2 contract address
   */
  public static getAddress(chainId: number): HexString {
    return exclusivePermit2Addresses[chainId] ?? DEFAULT_PERMIT2_ADDRESS;
  }

  /**
   * Generates a complete Permit2 signature with encoded data ready for transaction
   * Handles single token, batch, and witness transfer types
   * @param params - Permit2 parameters including tokens, spender, and chain info
   * @returns Promise resolving to permit response with signature and encoded data
   */
  public static async generateSignature(params: Permit2Params): Promise<BasePermitResponse> {
    try {
      const {
        chainId,
        account,
        tokens,
        spender,
        rpcUrls,
        deadline: sigDeadline,
        signer,
        permitType,
        firstTokenNonce,
        contractVersion,
        service,
      } = params;

      const deadline = sigDeadline ?? generateDeadline(SIGNATURE_EXPIRY_IN_SECS);
      const expiration = params.expiration ?? maxUint48;
      const permit2Address = this.getAddress(chainId);

      const normalizedTokens: TokenWithIndex[] = tokens.map((token) => ({
        ...token,
        amount: BigInt(token.amount || maxUint256).toString(),
      }));

      const witnessData = this.buildWitnessData(params);

      const { permit2Values, nonce } = await this.buildPermitValues({
        primaryType: permitType,
        spender,
        account,
        deadline,
        chainId,
        permit2Address,
        rpcUrls,
        tokens: normalizedTokens,
        expiration,
        firstTokenNonce: firstTokenNonce ?? null,
        service,
        contractVersion,
      });

      const typedData = this.buildTypedData(permit2Values, permit2Address, chainId, witnessData);

      const signature = await signTypedData({
        signer,
        domain: typedData.domain,
        message: typedData.message,
        types: typedData.types,
        account,
        primaryType: permitType,
      });

      const encodedPermitData = this.encodePermitData({
        permitType,
        tokens: normalizedTokens,
        nonce,
        deadline,
        expiration,
        signature,
        contractVersion,
        service,
      });

      const permitMode = this.getPermitMode(service ?? Services.trade, contractVersion ?? ContractVersion.v1, permitType);
      const permitData = encodeAbiParameters(parseAbiParameters('uint8, bytes'), [permitMode, encodedPermitData]);

      return {
        status: TxnStatus.success,
        code: StatusCodes.Success,
        permitData,
        nonce,
      };
    } catch (error) {
      logger.error('Error generating permit2 signature', {
        service: 'Permit2Service',
        method: 'generateSignature',
        error,
      });
      return parseError(error);
    }
  }

  /**
   * Builds witness data for Permit2 signature based on transaction type
   * Handles gasless swap, bridge, and standard transfers
   * @param params - Permit2 parameters containing gasless and transaction data
   * @returns Witness data object with type and witness fields
   */
  public static buildWitnessData(params: Permit2Params): WitnessData {
    const { gasless, account, spender } = params;

    if (gasless && params.swapDataHash && params.txType === GASLESS_TX_TYPE.swap) {
      return {
        witness: {
          txId: params.txId,
          user: account,
          executorFeesHash: params.executorFeesHash,
          swapDataHash: params.swapDataHash,
        },
        witnessTypeName: swapGaslessWitnessType.typeName,
        witnessType: swapGaslessWitnessType.type,
      };
    }

    if (gasless && params.swapDataHash) {
      return {
        witness: {
          txId: params.txId,
          user: account,
          executorFeesHash: params.executorFeesHash,
          swapDataHash: params.swapDataHash,
          adapterDataHash: params.adapterDataHash,
        },
        witnessTypeName: bridgeGaslessWitnessType.typeName,
        witnessType: bridgeGaslessWitnessType.type,
      };
    }

    return {
      witness: {
        owner: account,
        recipient: spender,
      },
      witnessTypeName: defaultWitnessType.typeName,
      witnessType: defaultWitnessType.type,
    };
  }

  /**
   * Builds permit values based on permit type (Single, Transfer, or Batch)
   * Fetches nonce from blockchain and constructs appropriate permit structure
   * @param params - Parameters for building permit values
   * @returns Promise with permit2 values and nonce
   */
  public static async buildPermitValues(
    params: Permit2ValuesParams,
  ): Promise<{ permit2Values: PermitTransferFromValues | PermitBatchTransferFromValues | PermitSingleValues; nonce: bigint }> {
    switch (params.primaryType) {
      case Permit2PrimaryTypes.PermitSingle:
        if (params.expiration === undefined || params.expiration === null) {
          throw new ValidationError('Expiration is required for PermitSingle');
        }
        return this.buildSinglePermitValues({ ...params, token: params.tokens[0], expiration: params.expiration });

      case Permit2PrimaryTypes.PermitWitnessTransferFrom:
        return this.buildTransferPermitValues({ ...params, token: params.tokens[0] });

      case Permit2PrimaryTypes.PermitBatchWitnessTransferFrom:
        return this.buildBatchPermitValues(params);

      default:
        logger.error('Invalid permit type', {
          service: 'Permit2Service',
          method: 'buildPermitValues',
          permitType: params.primaryType,
          chainId: params.chainId,
        });
        throw new ValidationError(`Invalid permit type: ${params.primaryType}`);
    }
  }

  /**
   * Builds EIP-712 typed data for signing based on permit type
   * @param permit - Permit values (single, transfer, or batch)
   * @param permit2Address - Permit2 contract address
   * @param chainId - Chain ID
   * @param witness - Optional witness data
   * @returns Typed data object ready for signing
   */
  public static buildTypedData(
    permit: PermitTransferFromValues | PermitBatchTransferFromValues | PermitSingleValues,
    permit2Address: Address,
    chainId: number,
    witness?: WitnessData,
  ): PermitTransferFromData | PermitBatchTransferFromData | PermitSingleData {
    if (this.isPermitSingle(permit)) {
      return this.buildSingleTypedData(permit, permit2Address, chainId);
    }

    if (!witness) {
      logger.error('Witness is required for PermitTransferFrom', {
        service: 'Permit2Service',
        method: 'buildTypedData',
        chainId,
      });
      throw new ValidationError('Witness is required for PermitTransferFrom');
    }

    if (this.isPermitTransferFrom(permit)) {
      return this.buildTransferTypedData(permit, permit2Address, chainId, witness);
    }

    return this.buildBatchTypedData(permit, permit2Address, chainId, witness);
  }

  /**
   * Builds the EIP-712 domain for Permit2
   * @param permit2Address - Permit2 contract address
   * @param chainId - Chain ID
   * @returns EIP-712 domain object
   */
  public static buildDomain(permit2Address: Address, chainId: number): TypedDataDomain {
    return {
      name: PERMIT2_DOMAIN_NAME,
      chainId,
      verifyingContract: permit2Address,
    };
  }

  /**
   * Encodes permit data based on permit type for contract execution
   * @param params - Parameters including permit type, tokens, nonce, and signature
   * @returns Encoded permit data as hex string
   */
  public static encodePermitData({
    permitType,
    tokens,
    nonce,
    deadline,
    expiration,
    signature,
    contractVersion,
    service,
  }: {
    permitType: Permit2PrimaryType;
    tokens: TokenWithIndex[];
    nonce: bigint;
    deadline: bigint;
    expiration: bigint;
    signature: HexString;
    contractVersion?: ContractVersion;
    service?: AvailableDZapServices;
  }): HexString {
    if (permitType === Permit2PrimaryTypes.PermitBatchWitnessTransferFrom) {
      return encodeAbiParameters(BatchPermitAbiParams, [
        {
          permitted: tokens.map((token) => ({ token: token.address, amount: BigInt(token.amount) })),
          nonce,
          deadline,
        },
        signature,
      ]);
    }

    if (permitType === Permit2PrimaryTypes.PermitWitnessTransferFrom) {
      return encodeAbiParameters(parseAbiParameters('uint256, uint256, bytes'), [nonce, deadline, signature]);
    }

    if (contractVersion === ContractVersion.v1 && service !== Services.zap) {
      return encodeAbiParameters(
        parseAbiParameters('uint160 allowanceAmount, uint48 nonce, uint48 expiration, uint256 sigDeadline, bytes signature'),
        [BigInt(tokens[0].amount), Number(nonce.toString()), Number(expiration.toString()), BigInt(deadline.toString()), signature],
      );
    }

    return encodeAbiParameters(parseAbiParameters('uint48 nonce, uint48 expiration, uint256 sigDeadline, bytes signature'), [
      Number(nonce.toString()),
      Number(expiration.toString()),
      BigInt(deadline.toString()),
      signature,
    ]);
  }

  /**
   * Gets the appropriate permit mode for DZap contracts
   * @param service - Service type (zap, trade, etc)
   * @param contractVersion - Contract version
   * @param permitType - Permit2 primary type
   * @returns Permit mode value
   */
  public static getPermitMode(service: AvailableDZapServices, contractVersion: ContractVersion, permitType: Permit2PrimaryType): number {
    if (service !== Services.zap && contractVersion === ContractVersion.v1) {
      return DZapV1PermitMode.PERMIT2_APPROVE;
    }
    return PermitToDZapPermitMode[permitType];
  }

  /**
   * Builds single token permit values with allowance check
   * @param params - Parameters including token and expiration
   * @returns Promise with single permit values and nonce
   */
  private static async buildSinglePermitValues({
    spender,
    deadline,
    chainId,
    rpcUrls,
    account,
    expiration,
    token,
    permit2Address,
  }: {
    spender: Address;
    deadline: bigint;
    chainId: number;
    account: HexString;
    expiration: bigint;
    token: TokenWithIndex;
    permit2Address: HexString;
    rpcUrls?: string[];
  }): Promise<{ permit2Values: PermitSingleValues; nonce: bigint }> {
    const publicClient = ChainsService.getPublicClient(chainId, { rpcUrls });
    const allowanceResult = await publicClient.readContract({
      address: permit2Address,
      abi: ABI.permit.permit2Abi,
      functionName: ERC20_FUNCTIONS.allowance,
      args: [account, token.address, spender],
    });

    return {
      permit2Values: {
        details: {
          token: token.address,
          amount: BigInt(token.amount),
          expiration,
          nonce: allowanceResult[2],
        },
        spender,
        sigDeadline: deadline,
      },
      nonce: BigInt(allowanceResult[2]),
    };
  }

  /**
   * Builds single token transfer permit values with nonce management
   * @param params - Parameters including token and nonce information
   * @returns Promise with transfer permit values and nonce
   */
  private static async buildTransferPermitValues({
    spender,
    deadline,
    chainId,
    rpcUrls,
    account,
    token,
    permit2Address,
    firstTokenNonce,
  }: {
    spender: Address;
    deadline: bigint;
    chainId: number;
    account: HexString;
    token: TokenWithIndex;
    permit2Address: HexString;
    firstTokenNonce: bigint | null;
    rpcUrls?: string[];
  }): Promise<{ permit2Values: PermitTransferFromValues; nonce: bigint }> {
    let nonce: bigint;

    if (token.index === 0) {
      nonce = await getNextPermit2Nonce(permit2Address, account, chainId, rpcUrls);
    } else if (firstTokenNonce === null) {
      logger.error('Unable to find nonce for token', {
        service: 'Permit2Service',
        method: 'buildTransferPermitValues',
        tokenAddress: token.address,
        tokenIndex: token.index,
        chainId,
      });
      throw new NotFoundError(`Unable to find nonce for token:${token.address} for PermitTransferFrom`);
    } else {
      nonce = BigInt(firstTokenNonce) + BigInt(token.index);
    }

    return {
      permit2Values: {
        permitted: {
          token: token.address,
          amount: BigInt(token.amount),
        },
        spender,
        nonce,
        deadline,
      },
      nonce,
    };
  }

  /**
   * Builds batch token transfer permit values
   * @param params - Parameters including multiple tokens
   * @returns Promise with batch permit values and nonce
   */
  private static async buildBatchPermitValues({
    spender,
    deadline,
    chainId,
    rpcUrls,
    account,
    permit2Address,
    tokens,
  }: {
    spender: Address;
    deadline: bigint;
    chainId: number;
    account: HexString;
    permit2Address: HexString;
    tokens: TokenWithIndex[];
    rpcUrls?: string[];
  }): Promise<{ permit2Values: PermitBatchTransferFromValues; nonce: bigint }> {
    const nonce = await getNextPermit2Nonce(permit2Address, account, chainId, rpcUrls);

    return {
      permit2Values: {
        permitted: tokens.map((token) => ({
          token: token.address,
          amount: BigInt(token.amount),
        })),
        spender,
        nonce,
        deadline,
      },
      nonce,
    };
  }

  /**
   * Builds EIP-712 typed data for single permit
   * @private
   */
  private static buildSingleTypedData(permit: PermitSingleValues, permit2Address: Address, chainId: number): PermitSingleData {
    const domain = this.buildDomain(permit2Address, chainId);

    const types = {
      PermitSingle: [
        { name: 'details', type: 'PermitDetails' },
        { name: 'spender', type: 'address' },
        { name: 'sigDeadline', type: 'uint256' },
      ],
      PermitDetails: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint160' },
        { name: 'expiration', type: 'uint48' },
        { name: 'nonce', type: 'uint48' },
      ],
    };

    return { domain, types, message: permit };
  }

  /**
   * Builds EIP-712 typed data for transfer permit with witness
   * @private
   */
  private static buildTransferTypedData(
    permit: PermitTransferFromValues,
    permit2Address: Address,
    chainId: number,
    witness: WitnessData,
  ): PermitTransferFromData {
    const domain = this.buildDomain(permit2Address, chainId);

    const types = {
      ...witness.witnessType,
      TokenPermissions: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      PermitWitnessTransferFrom: [
        { name: 'permitted', type: 'TokenPermissions' },
        { name: 'spender', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
        { name: 'witness', type: witness.witnessTypeName },
      ],
    };

    const message = Object.assign(permit, { witness: witness.witness });

    return { domain, types, message };
  }

  /**
   * Builds EIP-712 typed data for batch transfer permit with witness
   * @private
   */
  private static buildBatchTypedData(
    permit: PermitBatchTransferFromValues,
    permit2Address: Address,
    chainId: number,
    witness: WitnessData,
  ): PermitBatchTransferFromData {
    const domain = this.buildDomain(permit2Address, chainId);

    const types = {
      ...witness.witnessType,
      TokenPermissions: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      PermitBatchWitnessTransferFrom: [
        { name: 'permitted', type: 'TokenPermissions[]' },
        { name: 'spender', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
        { name: 'witness', type: witness.witnessTypeName },
      ],
    };

    const message = { ...permit, witness: witness.witness };

    return { domain, types, message };
  }

  /**
   * Type guard to check if permit is PermitSingle
   * @private
   */
  private static isPermitSingle(permit: PermitTransferFromValues | PermitBatchTransferFromValues | PermitSingleValues): permit is PermitSingleValues {
    return 'details' in permit && permit.details !== undefined;
  }

  /**
   * Type guard to check if permit is PermitTransferFrom
   * @private
   */
  private static isPermitTransferFrom(
    permit: PermitTransferFromValues | PermitBatchTransferFromValues | PermitSingleValues,
  ): permit is PermitTransferFromValues {
    return 'permitted' in permit && !Array.isArray(permit.permitted);
  }
}
