import { DEFAULT_PERMIT2_DATA, DEFAULT_PERMIT_DATA } from 'src/constants';
import { PermitTypes } from 'src/constants/permit';
import { DEFAULT_PERMIT_VERSION } from 'src/constants/permit2';
import { StatusCodes, TxnStatus } from 'src/enums';
import { BatchPermitCallbackParams, GaslessSignatureParams, GasSignatureParams, HexString, PermitMode } from 'src/types';
import { BatchPermitResponse, GaslessBridgeParams, GaslessSwapParams, PermitParams, PermitResponse, TokenWithIndex } from 'src/types/permit';
import { calcTotalSrcTokenAmount, isDZapNativeToken, isOneToMany } from 'src/utils';
import { signGaslessDzapUserIntent } from 'src/utils/permit/dzapUserIntentSign';
import { checkEIP2612PermitSupport, getEIP2612PermitSignature } from 'src/utils/permit/eip2612Permit';
import { getPermit2Signature } from 'src/utils/permit/permit2';

type BasePermitDataParams = {
  oneToMany: boolean;
  token: TokenWithIndex;
  totalSrcAmount: bigint;
  permitEIP2612DisabledTokens?: string[];
  permitType: PermitMode;
} & Omit<PermitParams, 'permitType'>;

type PermitDataParams = BasePermitDataParams & ({ gasless: false } | GaslessSwapParams | GaslessBridgeParams);

type BaseBatchPermitParams = {
  tokens: TokenWithIndex[];
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
    const { token, oneToMany, totalSrcAmount, chainId, rpcUrls, permitType, permitEIP2612DisabledTokens } = params;
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
      permitEIP2612DisabledTokens,
    });
    if (permitType === PermitTypes.EIP2612Permit || (permitType === PermitTypes.AutoPermit && eip2612PermitData.supportsPermit)) {
      if (!eip2612PermitData.supportsPermit) {
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
        },
        gasless: false,
        version: eip2612PermitData.version || DEFAULT_PERMIT_VERSION,
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
      return signGaslessDzapUserIntent({
        ...signPermitReq,
        account: sender,
      });
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
      userIntentData: resp.permitData
        ? {
            batchPermitData: resp.permitData,
          }
        : undefined,
    };
  };

  public static signPermit = async (
    signPermitReq: GasSignatureParams,
  ): Promise<
    | {
        status: TxnStatus;
        code: StatusCodes;
        tokens: {
          address: HexString;
          permitData?: HexString;
          amount: string;
        }[];
      }
    | {
        status: TxnStatus;
        code: StatusCodes;
        batchPermitData: HexString | null;
      }
  > => {
    const { chainId, tokens, rpcUrls, sender, signer, signatureCallback, spender, permitType, isBatchPermitAllowed } = signPermitReq;
    if (tokens.length === 0) return { status: TxnStatus.success, code: StatusCodes.Success, tokens };
    let firstTokenNonce: bigint | undefined;

    const oneToMany = tokens.length > 1 && isOneToMany(tokens[0].address, tokens[1].address);
    const totalSrcAmount = calcTotalSrcTokenAmount(tokens);

    // Utilize batch permit for transactions involving many-to-one token pairs or when the permitType is set to batch
    if (
      isBatchPermitAllowed &&
      (permitType === PermitTypes.PermitBatchWitnessTransferFrom || (permitType === PermitTypes.AutoPermit && tokens?.length > 1 && !oneToMany))
    ) {
      const permitDataReq = {
        ...signPermitReq,
        tokens: tokens.map((token, index) => ({ ...token, index })),
        firstTokenNonce,
        chainId,
        rpcUrls,
        account: sender,
        spender,
        signer,
        permitType: PermitTypes.PermitBatchWitnessTransferFrom, //override because only PermitBatchWitnessTransferFrom supports batch
      };

      const resp = await PermitTxnHandler.generateBatchPermitDataForTokens(permitDataReq);

      if (resp.status !== TxnStatus.success) {
        return { status: resp.status, code: resp.code, batchPermitData: null };
      }

      const { permitData, permitType: permitTypeForToken } = resp;
      if (signatureCallback) {
        await signatureCallback({
          batchPermitData: permitData,
          tokens,
          permitType: permitTypeForToken,
        } as BatchPermitCallbackParams);
      }
      return {
        status: TxnStatus.success,
        code: StatusCodes.Success,
        batchPermitData: permitData as HexString,
      };
    }

    for (let dataIdx = 0; dataIdx < tokens.length; dataIdx++) {
      const isFirstToken = dataIdx === 0;
      const permitDataReq = {
        ...signPermitReq,
        token: {
          ...tokens[dataIdx],
          index: dataIdx,
        },
        firstTokenNonce,
        oneToMany,
        totalSrcAmount,
        chainId,
        rpcUrls,
        account: sender,
        spender,
        permitType,
        signer,
      };

      const res = await PermitTxnHandler.generatePermitDataForToken(permitDataReq);

      if (res.status !== TxnStatus.success) {
        return { status: res.status, code: res.code, tokens };
      }
      const { permitData, nonce, permitType: permitTypeForToken } = res;

      tokens[dataIdx].permitData = res.permitData;

      // Store the nonce from the first token; required for PermitWitnessTransferFrom in one-to-many scenarios
      if (isFirstToken) {
        firstTokenNonce = nonce;
      }

      if (signatureCallback && !isDZapNativeToken(tokens[dataIdx].address)) {
        const amount = oneToMany && isFirstToken ? totalSrcAmount : BigInt(tokens[dataIdx].amount);
        await signatureCallback({
          permitData: permitData as HexString,
          srcToken: tokens[dataIdx].address as HexString,
          amount,
          permitType: permitTypeForToken,
        });
      }
    }

    return { status: TxnStatus.success, tokens, code: StatusCodes.Success };
  };
}

export default PermitTxnHandler;
