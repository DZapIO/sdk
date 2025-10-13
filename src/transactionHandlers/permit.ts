import { Signer } from 'ethers';
import { WalletClient } from 'viem';
import { DEFAULT_PERMIT2_DATA, DEFAULT_PERMIT_DATA } from '../constants';
import { PermitTypes } from '../constants/permit';
import { DEFAULT_PERMIT_VERSION } from '../constants/permit2';
import { StatusCodes, TxnStatus } from '../enums';
import { AvailableDZapServices, HexString, PermitMode } from '../types';
import { calcTotalSrcTokenAmount, isDZapNativeToken, isOneToMany } from '../utils';
import { getPermit2Signature } from '../utils/permit/permit2Methods';
import { checkEIP2612PermitSupport, getEIP2612PermitSignature } from '../utils/permit/permitMethods';

class PermitTxnHandler {
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
    permitEIP2612DisabledTokens,
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
    signer: WalletClient | Signer;
    service: AvailableDZapServices;
    permitEIP2612DisabledTokens?: string[];
  }): Promise<{ status: TxnStatus; code: StatusCodes; permitData: HexString; permitType: PermitMode }> => {
    if (isDZapNativeToken(token.address)) {
      return {
        status: TxnStatus.success,
        code: StatusCodes.Success,
        permitData: DEFAULT_PERMIT_DATA,
        permitType: PermitTypes.EIP2612Permit,
      };
    }

    const amount = oneToMany && isFirstToken ? totalSrcAmount : token.amount;
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
          permitType: PermitTypes.EIP2612Permit,
        };
      }
      const { permitData, status, code } = await getEIP2612PermitSignature({
        chainId,
        account: sender,
        token: token.address,
        spender,
        amount: BigInt(amount),
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
          permitType: PermitTypes.Permit2,
        };
      } else {
        const { status, code, permitData } = await getPermit2Signature({
          chainId,
          account: sender,
          token: token.address,
          spender,
          amount: BigInt(amount),
          service,
          signer,
          rpcUrls,
        });
        return {
          status,
          code,
          permitData: permitData as HexString,
          permitType: PermitTypes.Permit2,
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
    permitEIP2612DisabledTokens,
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
    signer: WalletClient | Signer;
    signatureCallback?: ({
      permitData,
      srcToken,
      amount,
      permitType,
    }: {
      permitData: HexString;
      srcToken: HexString;
      amount: string;
      permitType: PermitMode;
    }) => Promise<void>;
    spender: HexString;
    permitType: PermitMode;
    permitEIP2612DisabledTokens?: string[];
  }): Promise<{
    status: TxnStatus;
    tokens: {
      address: HexString;
      permitData?: HexString;
      amount: string;
    }[];
    code: StatusCodes;
  }> => {
    if (tokens.length === 0) return { status: TxnStatus.success, code: StatusCodes.Success, tokens };

    const oneToMany = tokens.length > 1 && isOneToMany(tokens[0].address, tokens[1].address);
    const totalSrcAmount = calcTotalSrcTokenAmount(tokens);

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
        permitEIP2612DisabledTokens,
      });

      if (status !== TxnStatus.success) {
        return { status, code, tokens };
      }

      tokens[dataIdx].permitData = permitData;

      if (signatureCallback && !isDZapNativeToken(tokens[dataIdx].address)) {
        const amount = oneToMany && isFirstToken ? totalSrcAmount.toString() : tokens[dataIdx].amount;
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
