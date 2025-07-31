import { DEFAULT_PERMIT2_DATA, DEFAULT_PERMIT_DATA, GaslessTxType } from 'src/constants';
import { PermitTypes } from 'src/constants/permit';
import { DEFAULT_PERMIT_VERSION } from 'src/constants/permit2';
import { StatusCodes, TxnStatus } from 'src/enums';
import { BatchPermitCallbackParams, HexString, SignPermitData } from 'src/types';
import { BatchPermitResponse, GenerateBatchPermitParams, GeneratePermitDataParams, PermitResponse } from 'src/types/permit';
import { calcTotalSrcTokenAmount, isDZapNativeToken, isOneToMany } from 'src/utils';
import { checkEIP2612PermitSupport, getEIP2612PermitSignature } from 'src/utils/permit/eip2612Permit';
import { getPermit2Signature } from 'src/utils/permit/permit2';

class PermitTxnHandler {
  static generateBatchPermitDataForTokens = async (params: GenerateBatchPermitParams): Promise<BatchPermitResponse> => {
    const resp = await getPermit2Signature({
      ...params,
      permitType: PermitTypes.PermitBatchWitnessTransferFrom,
    });
    return {
      ...resp,
      permitType: PermitTypes.PermitBatchWitnessTransferFrom,
    };
  };

  static generatePermitDataForToken = async (params: GeneratePermitDataParams): Promise<PermitResponse> => {
    const { token, oneToMany, totalSrcAmount, chainId, rpcUrls, account, spender, permitType, signer } = params;
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
        chainId,
        account,
        token: token.address,
        spender,
        amount,
        signer,
        rpcUrls,
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

  public static signPermit = async (
    signPermitReq: SignPermitData,
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
    const { chainId, tokens, rpcUrls, sender, signer, service, signatureCallback, spender, permitType } = signPermitReq;
    if (tokens.length === 0) return { status: TxnStatus.success, code: StatusCodes.Success, tokens };
    let firstTokenNonce: bigint | undefined;

    const oneToMany = tokens.length > 1 && isOneToMany(tokens[0].address, tokens[1].address);
    const totalSrcAmount = calcTotalSrcTokenAmount(tokens);

    // Utilize batch permit for transactions involving many-to-one token pairs or when the permitType is set to batch
    if (permitType === PermitTypes.PermitBatchWitnessTransferFrom || (permitType === PermitTypes.AutoPermit && tokens?.length > 1 && !oneToMany)) {
      const basePermitDataReq = {
        tokens: tokens.map((token, index) => ({ ...token, index })),
        firstTokenNonce,
        chainId,
        rpcUrls,
        account: sender,
        spender,
        permitType,
        signer,
        service,
      };

      const permitDataReq: GenerateBatchPermitParams = signPermitReq.gasless
        ? signPermitReq.txType === GaslessTxType.bridge
          ? {
              ...basePermitDataReq,
              gasless: true,
              txType: GaslessTxType.bridge,
              swapDataHash: signPermitReq.swapDataHash,
              executorFeesHash: signPermitReq.executorFeesHash,
              txId: signPermitReq.txId,
              adapterDataHash: signPermitReq.adapterDataHash,
            }
          : {
              ...basePermitDataReq,
              gasless: true,
              txType: GaslessTxType.swap,
              swapDataHash: signPermitReq.swapDataHash,
              executorFeesHash: signPermitReq.executorFeesHash,
              txId: signPermitReq.txId,
            }
        : {
            ...basePermitDataReq,
            gasless: false,
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
      const basePermitDataReq = {
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
        service,
      };

      const permitDataReq: GeneratePermitDataParams = signPermitReq.gasless
        ? signPermitReq.txType === GaslessTxType.bridge
          ? {
              ...basePermitDataReq,
              gasless: true,
              txType: GaslessTxType.bridge,
              swapDataHash: signPermitReq.swapDataHash,
              executorFeesHash: signPermitReq.executorFeesHash,
              txId: signPermitReq.txId,
              adapterDataHash: signPermitReq.adapterDataHash,
            }
          : {
              ...basePermitDataReq,
              gasless: true,
              txType: GaslessTxType.swap,
              swapDataHash: signPermitReq.swapDataHash,
              executorFeesHash: signPermitReq.executorFeesHash,
              txId: signPermitReq.txId,
            }
        : {
            ...basePermitDataReq,
            gasless: false,
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
