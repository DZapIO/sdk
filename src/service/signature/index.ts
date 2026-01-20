import { Services } from '../../constants';
import { DEFAULT_PERMIT_DATA, DEFAULT_PERMIT2_DATA, PermitTypes } from '../../constants/permit';
import { ContractVersion, StatusCodes, TxnStatus } from '../../enums';
import type { AvailableDZapServices, GaslessSignatureParams, GasSignatureParams, HexString, PermitMode, SignPermitResponse } from '../../types';
import type { GaslessBridgeParams, GaslessSwapParams, PermitParams, PermitResponse, TokenWithPermitData } from '../../types/permit';
import { calcTotalSrcTokenAmount, isDZapNativeToken, isOneToMany } from '../../utils';
import { getEIP2612PermitData } from '../../utils/eip2612Permit';
import { logger } from '../../utils/logger';
import { EIP2612 } from './eip2612';
import { Gasless } from './gasless';
import { Permit2 } from './permit2';

type BasePermitDataParams = {
  oneToMany: boolean;
  token: TokenWithPermitData;
  totalSrcAmount: bigint;
  permitType: PermitMode;
  firstTokenNonce?: bigint;
} & Omit<PermitParams, 'permitType'>;

type PermitDataParams = BasePermitDataParams & ({ gasless: false } | GaslessSwapParams | GaslessBridgeParams);

/**
 * SignatureService
 *
 * A service class for handling signing of permit signatures for token approvals.
 * Supports both gas-paid and gasless transactions with EIP-2612 and Permit2 standards.
 */
export class SignatureService {
  // ============================================================================
  // Public API - Main Entry Points
  // ============================================================================

  /**
   * Sign permit for tokens (gas-paid transactions)
   * Main entry point for generating permit signatures for token approvals
   *
   * @param signPermitReq - Gas signature parameters
   * @returns Promise resolving to signed permit response
   */
  public static signPermit = async (signPermitReq: GasSignatureParams): Promise<SignPermitResponse> => {
    const { tokens } = signPermitReq;
    if (tokens.length === 0) {
      return { status: TxnStatus.success, code: StatusCodes.Success, tokens, permitType: signPermitReq.permitType };
    }

    const oneToMany = tokens.length > 1 && isOneToMany(tokens[0].address, tokens[1].address);
    const tokensWithIndex: TokenWithPermitData[] = tokens.map((token, index) => ({ ...token, index }));

    const shouldUseBatch = this.shouldUseBatchPermit({
      permitType: signPermitReq.permitType,
      isBatchPermitAllowed: signPermitReq.isBatchPermitAllowed,
      tokens,
      oneToMany,
      contractVersion: signPermitReq.contractVersion,
      service: signPermitReq.service,
    });

    if (shouldUseBatch) {
      return this.signBatchPermit(signPermitReq, tokensWithIndex);
    } else {
      return this.signIndividualPermits(signPermitReq, tokensWithIndex, oneToMany);
    }
  };

  /**
   * Sign gasless user intent with permit
   * Main entry point for gasless transactions
   *
   * @param signPermitReq - Gasless signature parameters
   * @returns Promise resolving to signed permit response
   */
  public static signGaslessUserIntent = async (signPermitReq: GaslessSignatureParams) => {
    const { tokens, sender, permitType } = signPermitReq;
    const type = permitType === PermitTypes.AutoPermit ? PermitTypes.PermitBatchWitnessTransferFrom : permitType;

    if (type === PermitTypes.EIP2612Permit) {
      const resp = await Gasless.generateSignature({
        ...signPermitReq,
        account: sender,
      });
      return {
        status: resp.status,
        code: resp.code,
        data: resp?.data && {
          ...resp.data,
          type,
        },
      };
    }

    const resp = await Permit2.generateSignature({
      ...signPermitReq,
      tokens: tokens.map((token, index) => ({ ...token, index })),
      account: sender,
      permitType: type,
    });
    return {
      status: resp.status,
      code: resp.code,
      data: resp.permitData && {
        type: type,
        batchPermitData: resp.permitData,
      },
    };
  };

  /**
   * Sign batch permit for multiple tokens
   * @private
   */
  private static signBatchPermit = async (signPermitReq: GasSignatureParams, tokens: TokenWithPermitData[]): Promise<SignPermitResponse> => {
    const resp = await Permit2.generateSignature({
      ...signPermitReq,
      tokens: tokens.map((token, index) => ({ ...token, index })),
      account: signPermitReq.sender,
      permitType: PermitTypes.PermitBatchWitnessTransferFrom as any,
    });

    if (resp.status !== TxnStatus.success) {
      logger.error('Batch permit generation failed', {
        service: 'SignatureService',
        method: 'signBatchPermit',
        status: resp.status,
        code: resp.code,
        tokensCount: tokens.length,
      });
      return { status: resp.status, code: resp.code, permitType: PermitTypes.PermitBatchWitnessTransferFrom };
    }

    if (signPermitReq.signatureCallback) {
      await signPermitReq.signatureCallback({
        batchPermitData: resp.permitData as HexString,
        tokens,
        permitType: PermitTypes.PermitBatchWitnessTransferFrom,
      });
    }

    return {
      status: TxnStatus.success,
      code: StatusCodes.Success,
      batchPermitData: resp.permitData as HexString,
      permitType: PermitTypes.PermitBatchWitnessTransferFrom,
    };
  };

  /**
   * Sign permits for individual tokens (one-by-one)
   * @private
   */
  private static signIndividualPermits = async (
    signPermitReq: GasSignatureParams,
    tokens: TokenWithPermitData[],
    oneToMany: boolean,
  ): Promise<SignPermitResponse> => {
    const totalSrcAmount = calcTotalSrcTokenAmount(tokens);
    let firstTokenNonce: bigint | null = null;
    let permitType = this.v1PermitSupport({
      contractVersion: signPermitReq.contractVersion,
      service: signPermitReq.service,
    })
      ? PermitTypes.PermitSingle
      : signPermitReq.permitType;

    for (let dataIdx = 0; dataIdx < tokens.length; dataIdx++) {
      const isFirstToken = dataIdx === 0;
      const res = await this.signPermitForToken({
        ...signPermitReq,
        token: {
          ...tokens[dataIdx],
          index: dataIdx,
        },
        firstTokenNonce: firstTokenNonce ?? undefined,
        oneToMany,
        totalSrcAmount,
        account: signPermitReq.sender,
        permitType,
      });

      permitType = res.permitType;
      if (res.status !== TxnStatus.success) {
        logger.error('Token permit generation failed', {
          service: 'SignatureService',
          method: 'signIndividualPermits',
          tokenAddress: tokens[dataIdx].address,
          tokenIndex: dataIdx,
          status: res.status,
          code: res.code,
        });
        return { status: res.status, code: res.code, permitType: res.permitType };
      }

      (tokens[dataIdx] as any).permitData = res.permitData;

      // Store the nonce from the first token; required for PermitWitnessTransferFrom in one-to-many scenarios
      if (isFirstToken && !isDZapNativeToken(tokens[dataIdx].address)) {
        firstTokenNonce = res.nonce ?? null;
      }

      if (signPermitReq.signatureCallback && !isDZapNativeToken(tokens[dataIdx].address)) {
        const amount = oneToMany && isFirstToken ? totalSrcAmount : BigInt(tokens[dataIdx].amount);
        await signPermitReq.signatureCallback({
          permitData: res.permitData as HexString,
          srcToken: tokens[dataIdx].address as HexString,
          amount: amount.toString(),
          permitType: res.permitType,
        });
      }
    }

    return { status: TxnStatus.success, tokens, code: StatusCodes.Success, permitType };
  };

  /**
   * Sign permit for a single token
   * Routes to the appropriate permit type (EIP-2612 or Permit2) based on token support and permit type
   * @private
   */
  private static signPermitForToken = async (params: PermitDataParams): Promise<PermitResponse> => {
    const { token, oneToMany, totalSrcAmount, chainId, rpcUrls, permitType, account } = params;
    const isFirstToken = token.index === 0;

    // Handle native tokens (no permit needed)
    if (isDZapNativeToken(token.address)) {
      return {
        status: TxnStatus.success,
        code: StatusCodes.Success,
        permitData: DEFAULT_PERMIT_DATA,
        nonce: BigInt(0),
        permitType: PermitTypes.EIP2612Permit,
      };
    }

    const amount = oneToMany && isFirstToken ? totalSrcAmount : BigInt(token.amount);

    // Check if token supports EIP-2612 permit
    const eip2612PermitData = await getEIP2612PermitData({
      address: token.address,
      chainId,
      rpcUrls,
      owner: account,
      permit: token.permit,
    });

    const shouldUseEIP2612 = permitType === PermitTypes.EIP2612Permit || (permitType === PermitTypes.AutoPermit && eip2612PermitData.supportsPermit);

    if (shouldUseEIP2612) {
      return this.signEIP2612Signature(params, token, amount, eip2612PermitData, oneToMany, isFirstToken);
    } else {
      return this.signPermit2Signature(params, token, permitType, oneToMany, isFirstToken);
    }
  };

  /**
   * Sign EIP-2612 permit signature for a token
   * @private
   */
  private static signEIP2612Signature = async (
    params: PermitDataParams,
    token: TokenWithPermitData,
    amount: bigint,
    eip2612PermitData: Awaited<ReturnType<typeof getEIP2612PermitData>>,
    oneToMany: boolean,
    isFirstToken: boolean,
  ): Promise<PermitResponse> => {
    if (!eip2612PermitData.supportsPermit || !eip2612PermitData.data) {
      logger.error('Token does not support EIP-2612 permits', {
        service: 'SignatureService',
        method: 'signEIP2612Signature',
        chainId: params.chainId,
        tokenAddress: token.address,
        permitType: params.permitType,
      });
      throw new Error('Token does not support EIP-2612 permits');
    }

    // For one-to-many non-first tokens, return default permit data
    if (oneToMany && !isFirstToken) {
      return {
        status: TxnStatus.success,
        code: StatusCodes.Success,
        permitData: DEFAULT_PERMIT_DATA,
        nonce: BigInt(0),
        permitType: PermitTypes.EIP2612Permit,
      };
    }

    const { permitData, status, code } = await EIP2612.generateSignature({
      ...params,
      token: {
        address: token.address as HexString,
        amount: amount.toString(),
        index: 0,
        permit: token.permit,
      },
      gasless: false,
      version: eip2612PermitData.data.version,
      name: eip2612PermitData.data.name,
      nonce: eip2612PermitData.data.nonce,
    });

    return {
      status,
      code,
      permitData: permitData as HexString,
      nonce: BigInt(0),
      permitType: PermitTypes.EIP2612Permit,
    };
  };

  /**
   * Sign Permit2 signature for a token
   * @private
   */
  private static signPermit2Signature = async (
    params: PermitDataParams,
    token: TokenWithPermitData,
    permitType: PermitMode,
    oneToMany: boolean,
    isFirstToken: boolean,
  ): Promise<PermitResponse> => {
    const normalizedPermitType = permitType === PermitTypes.AutoPermit ? PermitTypes.PermitWitnessTransferFrom : permitType;

    // For one-to-many non-first tokens, return default permit data
    if (oneToMany && !isFirstToken) {
      return {
        status: TxnStatus.success,
        code: StatusCodes.Success,
        permitData: DEFAULT_PERMIT2_DATA,
        nonce: BigInt(0),
        permitType: normalizedPermitType,
      };
    }

    const resp = await Permit2.generateSignature({
      ...params,
      tokens: [token],
      permitType: normalizedPermitType as any,
    });

    return {
      ...resp,
      permitType: normalizedPermitType,
    };
  };

  /**
   * Check if contract version supports permit (v1 support)
   * @private
   */
  private static v1PermitSupport = ({ contractVersion, service }: { contractVersion: ContractVersion; service: AvailableDZapServices }): boolean => {
    return contractVersion === ContractVersion.v1 && service !== Services.zap;
  };

  /**
   * Determine if batch permit should be used
   * @private
   */
  private static shouldUseBatchPermit = ({
    permitType,
    isBatchPermitAllowed = true,
    tokens,
    oneToMany,
    contractVersion,
    service,
  }: {
    permitType: PermitMode;
    isBatchPermitAllowed?: boolean;
    tokens: {
      address: HexString;
      permitData?: HexString | undefined;
      amount: string;
    }[];
    oneToMany: boolean;
    contractVersion: ContractVersion;
    service: AvailableDZapServices;
  }) => {
    const isBatchPermitRequested = permitType === PermitTypes.PermitBatchWitnessTransferFrom;
    const shouldAutoBatch = permitType === PermitTypes.AutoPermit && tokens?.length > 1 && !oneToMany;
    const isContractSupport = !this.v1PermitSupport({ contractVersion, service });
    return isBatchPermitAllowed && (isBatchPermitRequested || shouldAutoBatch) && isContractSupport;
  };
}
