import { DEFAULT_PERMIT2_DATA, DEFAULT_PERMIT_DATA, Services } from '../constants';
import { PermitTypes } from '../constants/permit';
import { ContractVersion, StatusCodes, TxnStatus } from '../enums';
import { AvailableDZapServices, GaslessSignatureParams, GasSignatureParams, HexString, PermitMode, SignPermitResponse } from '../types';
import { BatchPermitResponse, GaslessBridgeParams, GaslessSwapParams, PermitParams, PermitResponse, TokenWithPermitData } from '../types/permit';
import { calcTotalSrcTokenAmount, isDZapNativeToken, isOneToMany } from '../utils';
import { signGaslessDzapUserIntent } from '../utils/signIntent/gasless';
import { checkEIP2612PermitSupport, getEIP2612PermitSignature } from '../utils/eip-2612/eip2612Permit';
import { getPermit2Signature } from '../utils/permit2';

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

class PermitTxnHandler {
  static generateBatchPermitDataForTokens = async (params: BatchPermitParams): Promise<BatchPermitResponse> => {
    const resp = await getPermit2Signature(params);
    return {
      ...resp,
      permitType: PermitTypes.PermitBatchWitnessTransferFrom,
    };
  };

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
      const { permitData, status, code } = await getEIP2612PermitSignature({
        ...params,
        token: {
          address: token.address as HexString,
          amount: amount.toString(),
          index: 0,
          permit: token.permit,
        },
        gasless: false,
        amount: BigInt(amount),
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
        const resp = await getPermit2Signature({
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

  public static signGaslessUserIntent = async (signPermitReq: GaslessSignatureParams) => {
    const { tokens, sender, permitType } = signPermitReq;

    const type = permitType === PermitTypes.AutoPermit ? PermitTypes.PermitBatchWitnessTransferFrom : permitType;

    if (type === PermitTypes.EIP2612Permit) {
      const resp = await signGaslessDzapUserIntent({
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
    const resp = await getPermit2Signature({
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
  static v1PermitSupport = ({ contractVersion, service }: { contractVersion: ContractVersion; service: AvailableDZapServices }): boolean => {
    return contractVersion === ContractVersion.v1 && service !== Services.zap;
  };

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
    const isContractSupport = !PermitTxnHandler.v1PermitSupport({ contractVersion, service });
    return isBatchPermitAllowed && (isBatchPermitRequested || shouldAutoBatch) && isContractSupport;
  };

  public static signPermit = async (signPermitReq: GasSignatureParams): Promise<SignPermitResponse> => {
    const { tokens } = signPermitReq;
    if (tokens.length === 0) {
      return { status: TxnStatus.success, code: StatusCodes.Success, tokens, permitType: signPermitReq.permitType };
    }
    const oneToMany = tokens.length > 1 && isOneToMany(tokens[0].address, tokens[1].address);

    const shouldUseBatchPermit = PermitTxnHandler.shouldUseBatchPermit({
      permitType: signPermitReq.permitType,
      isBatchPermitAllowed: signPermitReq.isBatchPermitAllowed,
      tokens,
      oneToMany,
      contractVersion: signPermitReq.contractVersion,
      service: signPermitReq.service,
    });

    if (shouldUseBatchPermit) {
      const resp = await PermitTxnHandler.generateBatchPermitDataForTokens({
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

      let permitType = PermitTxnHandler.v1PermitSupport({ contractVersion: signPermitReq.contractVersion, service: signPermitReq.service })
        ? PermitTypes.PermitSingle
        : signPermitReq.permitType;

      for (let dataIdx = 0; dataIdx < tokens.length; dataIdx++) {
        const isFirstToken = dataIdx === 0;

        const res = await PermitTxnHandler.generatePermitDataForToken({
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
}

export default PermitTxnHandler;
