import { DEFAULT_PERMIT2_DATA, DEFAULT_PERMIT_DATA } from 'src/constants';
import { StatusCodes, TxnStatus } from 'src/enums';
import { AvailableDZapServices, HexString, PermitMode } from 'src/types';
import { calcTotalSrcTokenAmount, isDZapNativeToken, isOneToMany } from 'src/utils';
import { getPermit2Signature } from 'src/utils/permit/permit2Methods';
import { checkEIP2612PermitSupport, getEIP2612PermitSignature } from 'src/utils/permit/permitMethods';
import { WalletClient } from 'viem';

import { Wallet } from 'ethers';
import { PermitTypes } from 'src/constants/permit';
import ContractHandler from '.';
import { DEFAULT_PERMIT_VERSION } from 'src/constants/permit2';

class PermitHandler {
  public static instance: PermitHandler;
  private contractHandler: ContractHandler;

  private constructor() {
    this.contractHandler = ContractHandler.getInstance();
  }

  public static getInstance(): PermitHandler {
    if (!PermitHandler.instance) {
      PermitHandler.instance = new PermitHandler();
    }
    return PermitHandler.instance;
  }

  private async generatePermitDataForToken({
    tokenData,
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
    tokenData: { srcToken: HexString; amount: string };
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
  }): Promise<{ status: TxnStatus; code: StatusCodes; permitData: HexString }> {
    if (isDZapNativeToken(tokenData.srcToken)) {
      return {
        status: TxnStatus.success,
        code: StatusCodes.Success,
        permitData: DEFAULT_PERMIT_DATA,
      };
    }

    const amount = oneToMany && isFirstToken ? totalSrcAmount : BigInt(tokenData.amount);
    const eip2612PermitData = await checkEIP2612PermitSupport({
      tokenAddress: tokenData.srcToken,
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
        token: tokenData.srcToken,
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
          token: tokenData.srcToken,
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
  }

  public async signPermit({
    chainId,
    data,
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
    data: {
      srcToken: HexString;
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
    data: {
      srcToken: string;
      permitData?: string;
      amount: string;
    }[];
    code: StatusCodes;
  }> {
    if (data.length === 0) return { status: TxnStatus.success, code: StatusCodes.Success, data };

    const oneToMany = data.length > 1 && isOneToMany(data[0].srcToken, data[1].srcToken);
    const totalSrcAmount = calcTotalSrcTokenAmount(data);

    for (let dataIdx = 0; dataIdx < data.length; dataIdx++) {
      const isFirstToken = dataIdx === 0;
      const { status, code, permitData } = await this.generatePermitDataForToken({
        tokenData: data[dataIdx],
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
        return { status, code, data };
      }

      data[dataIdx].permitData = permitData;

      if (signatureCallback && !isDZapNativeToken(data[dataIdx].srcToken)) {
        const amount = oneToMany && isFirstToken ? totalSrcAmount : BigInt(data[dataIdx].amount);
        await signatureCallback({
          permitData,
          srcToken: data[dataIdx].srcToken as HexString,
          amount,
        });
      }
    }

    return { status: TxnStatus.success, data, code: StatusCodes.Success };
  }
}

export default PermitHandler;
