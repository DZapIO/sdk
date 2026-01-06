import { ethers } from 'ethers';
import { getContract, encodeAbiParameters, maxUint256, parseAbiParameters } from 'viem';
import { Services } from '../../constants';
import { DEFAULT_PERMIT2_DATA, DEFAULT_PERMIT_DATA, PermitTypes } from '../../constants/permit';
import { GASLESS_TX_TYPE } from '../../constants';
import { DZapIntentPrimaryTypes, EIP2612_GASLESS_DOMAIN, SIGNATURE_EXPIRY_IN_SECS } from '../../constants/permit';
import { ContractVersion, DZapPermitMode, StatusCodes, TxnStatus } from '../../enums';
import { HexString, AvailableDZapServices, GaslessSignatureParams, GasSignatureParams, PermitMode, SignPermitResponse } from '../../types';
import { DzapUserIntentBridgeTypes, DzapUserIntentSwapBridgeTypes, DzapUserIntentSwapTypes, EIP2612DefaultTypes } from '../../types/eip-2612';
import {
  Gasless2612PermitParams,
  CustomTypedDataParams,
  BatchPermitResponse,
  GaslessBridgeParams,
  GaslessSwapParams,
  PermitParams,
  PermitResponse,
  TokenWithPermitData,
  DefaultPermit2612Params,
} from '../../types/permit';
import { generateDeadline } from '../../utils/date';
import { handleViemTransactionError } from '../../utils/errors';
import { getDZapAbi } from '../../utils/abi';
import { getPublicClient } from '../../utils/client';
import { signTypedData } from '../../utils/signer';
import { Permit2Service } from '../permit2';
import { calcTotalSrcTokenAmount, isDZapNativeToken, isOneToMany } from '../../utils';
import { checkEIP2612PermitSupport } from '../../utils/eip-2612/eip2612Permit';

type BasePermitDataParams = {
  oneToMany: boolean;
  token: TokenWithPermitData;
  totalSrcAmount: bigint;
  permitType: PermitMode;
  firstTokenNonce?: bigint;
} & Omit<PermitParams, 'permitType'>;

type PermitDataParams = BasePermitDataParams & ({ gasless: false } | GaslessSwapParams | GaslessBridgeParams);

type BaseBatchPermitParams = {
  tokens: TokenWithPermitData[];
  permitType: typeof PermitTypes.PermitBatchWitnessTransferFrom;
} & Omit<PermitParams, 'permitType'>;

type BatchPermitParams = BaseBatchPermitParams & ({ gasless: false } | GaslessSwapParams | GaslessBridgeParams);

/**
 * SignatureService
 *
 * A service class for handling signing of various intent types including
 * gasless transactions, custom typed data, and permit signatures.
 */
export class SignatureService {
  /**
   * Private helper method to get the typed data structure for gasless transactions
   */
  private static getSignTypedData(
    params: Gasless2612PermitParams & {
      nonce: bigint;
    },
  ) {
    const { account, deadline, nonce, swapDataHash } = params;

    if (params.txType === GASLESS_TX_TYPE.swap) {
      return {
        message: {
          //swap
          txId: params.txId,
          user: account,
          executorFeesHash: params.executorFeesHash,
          swapDataHash: params.swapDataHash,
          nonce,
          deadline,
        },
        types: DzapUserIntentSwapTypes,
        primaryType: DZapIntentPrimaryTypes.SignedGasLessSwapData,
      };
    } else if (swapDataHash) {
      return {
        message: {
          //swapBridge
          txId: params.txId,
          user: account,
          nonce,
          deadline,
          executorFeesHash: params.executorFeesHash,
          swapDataHash: params.swapDataHash,
          adapterDataHash: params.adapterDataHash,
        },
        types: DzapUserIntentSwapBridgeTypes,
        primaryType: DZapIntentPrimaryTypes.SignedGasLessSwapBridgeData,
      };
    } else {
      return {
        message: {
          //bridge
          txId: params.txId,
          user: account,
          nonce,
          deadline,
          executorFeesHash: params.executorFeesHash,
          adapterDataHash: params.adapterDataHash,
        },
        types: DzapUserIntentBridgeTypes,
        primaryType: DZapIntentPrimaryTypes.SignedGasLessBridgeData,
      };
    }
  }

  /**
   * Sign a gasless intent transaction
   *
   * @param params - Parameters for gasless intent
   * @returns Promise with signature, nonce, and deadline
   */
  static async signGaslessIntent(params: Gasless2612PermitParams): Promise<{
    status: TxnStatus;
    code: StatusCodes;
    data?: {
      signature: HexString;
      nonce: bigint;
      deadline: bigint;
    };
  }> {
    try {
      const { chainId, spender, account, signer, rpcUrls } = params;
      const deadline = params.deadline || generateDeadline(SIGNATURE_EXPIRY_IN_SECS);

      const contract = getContract({
        abi: getDZapAbi('trade', params.contractVersion),
        address: spender,
        client: getPublicClient({ chainId, rpcUrls }),
      });

      const nonce = (await contract.read.getNonce([account])) as bigint;

      const domain = {
        name: EIP2612_GASLESS_DOMAIN.name,
        version: EIP2612_GASLESS_DOMAIN.version,
        chainId,
        verifyingContract: spender,
        salt: EIP2612_GASLESS_DOMAIN.salt,
      };

      const { message, types, primaryType } = this.getSignTypedData({
        ...params,
        deadline,
        nonce,
      });

      const signature = await signTypedData({
        signer,
        domain,
        message,
        types,
        account,
        primaryType,
      });

      return {
        status: TxnStatus.success,
        code: StatusCodes.Success,
        data: {
          signature,
          nonce,
          deadline,
        },
      };
    } catch (error: any) {
      return handleViemTransactionError({ error });
    }
  }

  /**
   * Sign custom typed data
   *
   * @param params - Parameters for custom typed data signing
   * @returns Promise with signature and message
   */
  static async signCustomTypedData(params: CustomTypedDataParams): Promise<{
    status: TxnStatus;
    code: StatusCodes;
    data?: {
      signature: HexString;
      message: Record<string, any>;
    };
  }> {
    try {
      const { account, signer, message, domain, primaryType, types } = params;

      const signature = await signTypedData({
        signer,
        account,
        domain,
        message,
        primaryType,
        types,
      });
      return {
        status: TxnStatus.success,
        code: StatusCodes.Success,
        data: {
          signature,
          message,
        },
      };
    } catch (error: any) {
      return handleViemTransactionError({ error });
    }
  }

  /**
   * Generate batch permit data for multiple tokens
   * @param params - Batch permit parameters
   * @returns Promise resolving to batch permit response
   */
  static generateBatchPermitDataForTokens = async (params: BatchPermitParams): Promise<BatchPermitResponse> => {
    const resp = await Permit2Service.generateSignature(params);
    return {
      ...resp,
      permitType: PermitTypes.PermitBatchWitnessTransferFrom,
    };
  };

  /**
   * Generate permit data for a single token
   * @param params - Permit data parameters
   * @returns Promise resolving to permit response
   */
  static generatePermitDataForToken = async (params: PermitDataParams): Promise<PermitResponse> => {
    const { token, oneToMany, totalSrcAmount, chainId, rpcUrls, permitType, account } = params;
    const isFirstToken = token.index === 0;
    if (isDZapNativeToken(token.address)) {
      return {
        status: TxnStatus.success,
        code: StatusCodes.Success,
        permitData: DEFAULT_PERMIT_DATA,
        nonce: BigInt(0), // For native tokens, nonce is not used
        permitType: PermitTypes.EIP2612Permit,
      };
    }

    const amount = oneToMany && isFirstToken ? totalSrcAmount : BigInt(token.amount);
    const eip2612PermitData = await checkEIP2612PermitSupport({
      address: token.address,
      chainId,
      rpcUrls,
      owner: account,
      permit: token.permit,
    });
    if (permitType === PermitTypes.EIP2612Permit || (permitType === PermitTypes.AutoPermit && eip2612PermitData.supportsPermit)) {
      if (!eip2612PermitData.supportsPermit || !eip2612PermitData.data) {
        throw new Error('Token does not support EIP-2612 permits');
      }

      if (oneToMany && !isFirstToken) {
        return {
          status: TxnStatus.success,
          code: StatusCodes.Success,
          permitData: DEFAULT_PERMIT_DATA,
          nonce: BigInt(0), // For EIP2612 permits, nonce is not used it's already set in permitData
          permitType: PermitTypes.EIP2612Permit,
        };
      }
      const { permitData, status, code } = await SignatureService.getEIP2612PermitSignature({
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
        nonce: BigInt(0), // For EIP2612 permits, nonce is not used
        permitType: PermitTypes.EIP2612Permit,
      };
    } else {
      // If permitType is AutoPermit, set to PermitWitnessTransferFrom; otherwise, use the selected permitType
      const normalizedPermitType = permitType === PermitTypes.AutoPermit ? PermitTypes.PermitWitnessTransferFrom : permitType;

      if (oneToMany && !isFirstToken) {
        return {
          status: TxnStatus.success,
          code: StatusCodes.Success,
          permitData: DEFAULT_PERMIT2_DATA,
          nonce: BigInt(0), // For one-to-many non-first tokens, nonce is not used
          permitType: normalizedPermitType,
        };
      } else {
        const resp = await Permit2Service.generateSignature({
          ...params,
          tokens: [token],
          permitType: normalizedPermitType,
        });
        return {
          ...resp,
          permitType: normalizedPermitType,
        };
      }
    }
  };

  /**
   * Sign gasless user intent with permit
   * @param signPermitReq - Gasless signature parameters
   * @returns Promise resolving to signed permit response
   */
  public static signGaslessUserIntent = async (signPermitReq: GaslessSignatureParams) => {
    const { tokens, sender, permitType } = signPermitReq;

    const type = permitType === PermitTypes.AutoPermit ? PermitTypes.PermitBatchWitnessTransferFrom : permitType;

    if (type === PermitTypes.EIP2612Permit) {
      const resp = await SignatureService.signGaslessIntent({
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
    const resp = await Permit2Service.generateSignature({
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
   * Check if contract version supports permit (v1 support)
   * @param params - Contract version and service
   * @returns Boolean indicating permit support
   */
  static v1PermitSupport = ({ contractVersion, service }: { contractVersion: ContractVersion; service: AvailableDZapServices }): boolean => {
    return contractVersion === ContractVersion.v1 && service !== Services.zap;
  };

  /**
   * Determine if batch permit should be used
   * @param params - Parameters for batch permit decision
   * @returns Boolean indicating if batch permit should be used
   */
  public static shouldUseBatchPermit = ({
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
    // Utilize batch permit for transactions involving many-to-one token pairs or when the permitType is set to batch
    const isBatchPermitRequested = permitType === PermitTypes.PermitBatchWitnessTransferFrom;

    const shouldAutoBatch = permitType === PermitTypes.AutoPermit && tokens?.length > 1 && !oneToMany;
    const isContractSupport = !SignatureService.v1PermitSupport({ contractVersion, service });
    return isBatchPermitAllowed && (isBatchPermitRequested || shouldAutoBatch) && isContractSupport;
  };

  /**
   * Sign permit for tokens
   * @param signPermitReq - Gas signature parameters
   * @returns Promise resolving to signed permit response
   */
  public static signPermit = async (signPermitReq: GasSignatureParams): Promise<SignPermitResponse> => {
    const { tokens } = signPermitReq;
    if (tokens.length === 0) {
      return { status: TxnStatus.success, code: StatusCodes.Success, tokens, permitType: signPermitReq.permitType };
    }
    const oneToMany = tokens.length > 1 && isOneToMany(tokens[0].address, tokens[1].address);

    const shouldUseBatchPermit = SignatureService.shouldUseBatchPermit({
      permitType: signPermitReq.permitType,
      isBatchPermitAllowed: signPermitReq.isBatchPermitAllowed,
      tokens,
      oneToMany,
      contractVersion: signPermitReq.contractVersion,
      service: signPermitReq.service,
    });

    if (shouldUseBatchPermit) {
      const resp = await SignatureService.generateBatchPermitDataForTokens({
        ...signPermitReq,
        tokens: tokens.map((token, index) => ({ ...token, index })),
        account: signPermitReq.sender,
        permitType: PermitTypes.PermitBatchWitnessTransferFrom, //override because only PermitBatchWitnessTransferFrom supports batch
      });

      if (resp.status !== TxnStatus.success) {
        return { status: resp.status, code: resp.code, permitType: PermitTypes.PermitBatchWitnessTransferFrom };
      }
      if (signPermitReq.signatureCallback) {
        await signPermitReq.signatureCallback({
          batchPermitData: resp.permitData as HexString,
          tokens,
          permitType: resp.permitType,
        });
      }
      return {
        status: TxnStatus.success,
        code: StatusCodes.Success,
        batchPermitData: resp.permitData as HexString,
        permitType: resp.permitType,
      };
    } else {
      const totalSrcAmount = calcTotalSrcTokenAmount(tokens);
      let firstTokenNonce: bigint | null = null;

      let permitType = SignatureService.v1PermitSupport({ contractVersion: signPermitReq.contractVersion, service: signPermitReq.service })
        ? PermitTypes.PermitSingle
        : signPermitReq.permitType;

      for (let dataIdx = 0; dataIdx < tokens.length; dataIdx++) {
        const isFirstToken = dataIdx === 0;

        const res = await SignatureService.generatePermitDataForToken({
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
          return { status: res.status, code: res.code, permitType: res.permitType };
        }

        tokens[dataIdx].permitData = res.permitData;

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
    }
  };

  /**
   * Generate EIP-2612 permit signature
   * @param params - EIP-2612 permit parameters
   * @returns Promise resolving to permit data
   */
  public static async getEIP2612PermitSignature(
    params: DefaultPermit2612Params,
  ): Promise<{ status: TxnStatus; code: StatusCodes; permitData?: HexString }> {
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
  }
}
