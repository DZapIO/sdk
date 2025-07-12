import { DEFAULT_PERMIT2_DATA, DEFAULT_PERMIT_DATA } from 'src/constants';
import { StatusCodes, TxnStatus } from 'src/enums';
import { AvailableDZapServices, HexString, PermitMode } from 'src/types';
import { calcTotalSrcTokenAmount, isDZapNativeToken, isOneToMany } from 'src/utils';
import { getPermit2Signature } from 'src/utils/permit/permit2Methods';
import { checkEIP2612PermitSupport, getEIP2612PermitSignature } from 'src/utils/permit/permitMethods';
import { WalletClient } from 'viem';

import { Wallet } from 'ethers';
import { PermitTypes } from 'src/constants/permit';
import { DEFAULT_PERMIT_VERSION } from 'src/constants/permit2';

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
  }): Promise<{ status: TxnStatus; code: StatusCodes; permitData: HexString }> => {
    if (isDZapNativeToken(token.address)) {
      return {
        status: TxnStatus.success,
        code: StatusCodes.Success,
        permitData: DEFAULT_PERMIT_DATA,
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
      };
    } else {
      if (oneToMany && !isFirstToken) {
        return {
          status: TxnStatus.success,
          code: StatusCodes.Success,
          permitData: DEFAULT_PERMIT2_DATA,
        };
      } else {
        const { status, code, permitData } = await getPermit2Signature({
          chainId,
          account: sender,
          token: token.address,
          spender,
          amount,
          service,
          signer,
          rpcUrls,
        });
        return {
          status,
          code,
          permitData: permitData as HexString,
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
    signatureCallback?: ({ permitData, srcToken, amount }: { permitData: HexString; srcToken: HexString; amount: bigint }) => Promise<void>;
    spender: HexString;
    permitType: PermitMode;
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
      const { status, code, permitData } = await PermitTxnHandler.generatePermitDataForToken({
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
        });
      }
    }

    return { status: TxnStatus.success, tokens, code: StatusCodes.Success };
  };
}

export default PermitTxnHandler;
