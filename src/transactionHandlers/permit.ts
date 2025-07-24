import { Wallet } from 'ethers';
import { DEFAULT_PERMIT2_DATA, DEFAULT_PERMIT_DATA } from 'src/constants';
import { PermitTypes } from 'src/constants/permit';
import { DEFAULT_PERMIT_VERSION } from 'src/constants/permit2';
import { StatusCodes, TxnStatus } from 'src/enums';
import { AvailableDZapServices, HexString, PermitMode } from 'src/types';
import { calcTotalSrcTokenAmount, isDZapNativeToken, isOneToMany } from 'src/utils';
import { getPermit2Signature } from 'src/utils/permit/permit2Methods';
import { checkEIP2612PermitSupport, getEIP2612PermitSignature } from 'src/utils/permit/permitMethods';
import { WalletClient } from 'viem';

class PermitTxnHandler {
  static generateBatchPermitDataForTokens = async ({
    tokens,
    chainId,
    rpcUrls,
    sender,
    spender,
    signer,
    service,
  }: {
    tokens: { address: HexString; amount: string }[];
    chainId: number;
    rpcUrls?: string[];
    sender: HexString;
    spender: HexString;
    signer: WalletClient | Wallet;
    service: AvailableDZapServices;
  }): Promise<{ status: TxnStatus; code: StatusCodes; permitData: HexString; permitType: PermitMode }> => {
    const { status, code, permitData } = await getPermit2Signature({
      chainId,
      account: sender,
      tokens,
      spender,
      service,
      signer,
      rpcUrls,
      permitType: PermitTypes.PermitBatchWitnessTransferFrom,
    });
    return {
      status,
      code,
      permitData: permitData as HexString,
      permitType: PermitTypes.PermitBatchWitnessTransferFrom,
    };
  };

  static generatePermitDataForToken = async ({
    token,
    isFirstToken,
    oneToMany,
    totalSrcAmount,
    chainId,
    rpcUrls,
    sender,
    spender,
    permitType,
    signer,
    service,
  }: {
    token: { address: HexString; amount: string };
    isFirstToken: boolean;
    oneToMany: boolean;
    totalSrcAmount: bigint;
    chainId: number;
    rpcUrls?: string[];
    sender: HexString;
    spender: HexString;
    permitType: PermitMode;
    signer: WalletClient | Wallet;
    service: AvailableDZapServices;
  }): Promise<{ status: TxnStatus; code: StatusCodes; permitData: HexString; permitType: PermitMode }> => {
    if (isDZapNativeToken(token.address)) {
      return {
        status: TxnStatus.success,
        code: StatusCodes.Success,
        permitData: DEFAULT_PERMIT_DATA,
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
          permitType: PermitTypes.EIP2612Permit,
        };
      }
      const { permitData, status, code } = await getEIP2612PermitSignature({
        chainId,
        account: sender,
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
        permitType: PermitTypes.EIP2612Permit,
      };
    } else {
      if (oneToMany && !isFirstToken) {
        return {
          status: TxnStatus.success,
          code: StatusCodes.Success,
          permitData: DEFAULT_PERMIT2_DATA,
          permitType: PermitTypes.PermitWitnessTransferFrom,
        };
      } else {
        const { status, code, permitData } = await getPermit2Signature({
          chainId,
          account: sender,
          tokens: [
            {
              address: token.address,
              amount: token.amount,
            },
          ],
          spender,
          service,
          signer,
          rpcUrls,
          permitType: PermitTypes.PermitWitnessTransferFrom,
        });
        return {
          status,
          code,
          permitData: permitData as HexString,
          permitType: PermitTypes.PermitWitnessTransferFrom,
        };
      }
    }
  };

  public static signPermit = async ({
    chainId,
    tokens,
    rpcUrls,
    sender,
    signer,
    service,
    signatureCallback,
    spender,
    permitType,
  }: {
    chainId: number;
    sender: HexString;
    tokens: {
      address: HexString;
      permitData?: HexString;
      amount: string;
    }[];
    service: AvailableDZapServices;
    rpcUrls?: string[];
    signer: WalletClient | Wallet;
    signatureCallback?: ({
      permitData,
      srcToken,
      amount,
      permitType,
    }: {
      permitData: HexString;
      srcToken: HexString;
      amount: bigint;
      permitType: PermitMode;
    }) => Promise<void>;
    spender: HexString;
    permitType: PermitMode;
  }): Promise<{
    status: TxnStatus;
    code: StatusCodes;
    tokens: {
      address: HexString;
      permitData?: HexString;
      amount: string;
    }[];
  }> => {
    if (tokens.length === 0) return { status: TxnStatus.success, code: StatusCodes.Success, tokens };

    const oneToMany = tokens.length > 1 && isOneToMany(tokens[0].address, tokens[1].address);
    const totalSrcAmount = calcTotalSrcTokenAmount(tokens);

    // use batch permit for many to one tokens, for permitType selected
    // if (permitType === PermitTypes.PermitBatchWitnessTransferFrom || (tokens?.length > 1 && !oneToMany)) {
    //   const {
    //     status,
    //     code,
    //     permitData,
    //     permitType: permitTypeForToken,
    //   } = await PermitTxnHandler.generateBatchPermitDataForTokens({
    //     tokens,
    //     chainId,
    //     rpcUrls,
    //     sender,
    //     spender,
    //     signer,
    //     service,
    //   });
    //   if (status !== TxnStatus.success) {
    //     return { status, code, data: { batchPermitData: undefined } };
    //   }
    //   if (signatureCallback) {
    //     await signatureCallback({
    //       batchPermitData: permitData,
    //       tokens,
    //       permitType: permitTypeForToken,
    //     } as unknown as BatchPermitCallbackParams);
    //   }
    //   return { status: TxnStatus.success, code: StatusCodes.Success, data: { batchPermitData: permitData } };
    // }
    for (let dataIdx = 0; dataIdx < tokens.length; dataIdx++) {
      const isFirstToken = dataIdx === 0;
      const {
        status,
        code,
        permitData,
        permitType: permitTypeForToken,
      } = await PermitTxnHandler.generatePermitDataForToken({
        token: tokens[dataIdx],
        isFirstToken,
        oneToMany,
        totalSrcAmount,
        chainId,
        rpcUrls,
        sender,
        spender,
        permitType,
        signer,
        service,
      });

      if (status !== TxnStatus.success) {
        return { status, code, tokens };
      }

      tokens[dataIdx].permitData = permitData;

      if (signatureCallback && !isDZapNativeToken(tokens[dataIdx].address)) {
        const amount = oneToMany && isFirstToken ? totalSrcAmount : BigInt(tokens[dataIdx].amount);
        await signatureCallback({
          permitData,
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
