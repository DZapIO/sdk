import { DEFAULT_PERMIT_DATA, PERMIT2_APPROVE_DATA } from 'src/constants';
import { Erc20Functions, StatusCodes, TxnStatus } from 'src/enums';
import { AvailableDZapServices, HexString } from 'src/types';
import { calcTotalSrcTokenAmount, isDZapNativeToken, isOneToMany, isTypeSigner, writeContract } from 'src/utils';
import { checkPermit2, getPermit2Address, getPermit2PermitDataForApprove } from 'src/utils/permit/permit2Methods';
import { Abi, WalletClient, encodeFunctionData, maxUint256 } from 'viem';

import { erc20Abi } from 'src/artifacts';
import ContractHandler from '.';
import { Signer, Wallet } from 'ethers';

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

  public async handleGetAllowance({
    chainId,
    sender,
    data,
    rpcUrls,
  }: {
    chainId: number;
    sender: HexString;
    data: { srcToken: HexString; amount: bigint }[];
    rpcUrls: string[];
  }) {
    const tokenAllowances: { [key: string]: bigint } = {};
    // other cases like many to one or one to one
    let noOfApprovalsRequired = 0;
    let noOfSignaturesRequired = 0;
    for (let dataIdx = 0; dataIdx < data.length; dataIdx++) {
      const { srcToken, amount } = data[dataIdx];
      if (isDZapNativeToken(srcToken)) {
        tokenAllowances[srcToken] = maxUint256;
        continue;
      }
      const {
        status,
        code,
        data: { permitAllowance },
      } = await checkPermit2({
        chainId,
        srcToken,
        rpcUrls,
        userAddress: sender as HexString,
      });
      if (permitAllowance < BigInt(amount)) {
        noOfApprovalsRequired++;
      }
      noOfSignaturesRequired++;
      tokenAllowances[srcToken] = permitAllowance;
      if (code !== StatusCodes.Success) {
        return { status, code, data: { tokenAllowances, noOfApprovalsRequired, noOfSignaturesRequired } };
      }
    }
    return { status: TxnStatus.success, code: StatusCodes.Success, data: { tokenAllowances, noOfApprovalsRequired, noOfSignaturesRequired } };
  }

  public async handleApprove({
    chainId,
    signer,
    rpcUrls,
    data,
    approvalTxnCallback,
  }: {
    chainId: number;
    signer: WalletClient | Signer;
    sender: HexString;
    data: { srcToken: HexString; amountToApprove: bigint }[];
    rpcUrls?: string[];
    approvalTxnCallback?: ({
      txnDetails,
      address,
    }: {
      txnDetails: { txnHash: string; code: StatusCodes; status: TxnStatus };
      address: HexString;
    }) => Promise<TxnStatus | void>;
  }) {
    for (let dataIdx = 0; dataIdx < data.length; dataIdx++) {
      let txnDetails = { status: TxnStatus.success, code: StatusCodes.Success, txnHash: '' };
      if (isTypeSigner(signer)) {
        console.log('Using ethers signer.');
        const from = await signer.getAddress();
        const callData = encodeFunctionData({
          abi: erc20Abi,
          functionName: Erc20Functions.approve,
          args: [getPermit2Address(chainId), data[dataIdx].amountToApprove],
        });
        await signer.sendTransaction({
          from,
          chainId,
          to: data[dataIdx].srcToken as HexString,
          data: callData,
        });
        return {
          status: TxnStatus.success,
          code: StatusCodes.Success,
        };
      } else {
        txnDetails = await writeContract({
          chainId,
          contractAddress: data[dataIdx].srcToken as HexString,
          abi: erc20Abi as Abi,
          functionName: Erc20Functions.approve,
          args: [getPermit2Address(chainId), data[dataIdx].amountToApprove],
          rpcUrls,
          signer,
        });
      }
      if (txnDetails.code !== StatusCodes.Success) {
        return {
          status: txnDetails.status,
          code: txnDetails?.code || StatusCodes.FunctionNotFound,
        };
      }
      if (approvalTxnCallback) {
        const callbackStatus = await approvalTxnCallback({ txnDetails, address: data[dataIdx].srcToken });
        if (callbackStatus && callbackStatus !== TxnStatus.success) {
          return {
            status: txnDetails.status,
            code: txnDetails?.code || StatusCodes.Error,
          };
        }
      }
    }
    return { status: TxnStatus.success, code: StatusCodes.Success };
  }
  public async handleSign({
    chainId,
    data,
    rpcUrls,
    sender,
    signer,
    service,
    signatureCallback,
    spender,
  }: {
    chainId: number;
    sender: string;
    data: {
      srcToken: string;
      permitData?: string;
      amount: string;
    }[];
    service: AvailableDZapServices;
    rpcUrls?: string[];
    signer: WalletClient | Wallet;
    signatureCallback?: ({ permitData, srcToken, amount }: { permitData: HexString; srcToken: HexString; amount: bigint }) => Promise<void>;
    spender: string;
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
    let totalSrcAmount = BigInt(0);
    if (oneToMany) totalSrcAmount = calcTotalSrcTokenAmount(data);
    const dzapContractAddress = spender;
    if (isDZapNativeToken(data[0].srcToken)) {
      data[0].permitData = DEFAULT_PERMIT_DATA;
    } else {
      const amount = oneToMany ? totalSrcAmount : BigInt(data[0].amount);
      const { status, code, permitData } = await getPermit2PermitDataForApprove({
        chainId,
        account: sender as HexString,
        token: data[0].srcToken as HexString,
        dzapContractAddress,
        amount,
        service,
        signer,
        rpcUrls,
      });
      if (status === TxnStatus.success) {
        data[0].permitData = permitData as HexString;
        if (signatureCallback) await signatureCallback({ permitData: permitData as HexString, amount, srcToken: data[0].srcToken as HexString });
      } else {
        return { status, code, data };
      }
    }
    for (let dataIdx = 1; dataIdx < data.length; dataIdx++) {
      let permitData = DEFAULT_PERMIT_DATA;
      if (!isDZapNativeToken(data[dataIdx].srcToken)) {
        if (oneToMany) {
          permitData = PERMIT2_APPROVE_DATA;
        } else {
          const amount = oneToMany ? totalSrcAmount : BigInt(data[dataIdx].amount);
          const {
            status,
            code,
            permitData: permit2ApprovePermitData,
          } = await getPermit2PermitDataForApprove({
            chainId,
            account: sender as HexString,
            token: data[dataIdx].srcToken as HexString,
            dzapContractAddress,
            amount,
            service,
            signer,
            rpcUrls,
          });
          if (status === TxnStatus.success) {
            permitData = permit2ApprovePermitData as HexString;
            if (signatureCallback) await signatureCallback({ permitData, srcToken: data[dataIdx].srcToken as HexString, amount });
          } else {
            return { status, code, data };
          }
        }
      }
      data[dataIdx].permitData = permitData;
    }

    return { status: TxnStatus.success, data, code: StatusCodes.Success };
  }
}

export default PermitHandler;
