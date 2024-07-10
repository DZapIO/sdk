import { DEFAULT_PERMIT_DATA, PERMIT2_ADDRESS, PERMIT2_APPROVE_DATA } from 'src/constants';
import { Erc20Functions, StatusCodes, TxnStatus } from 'src/enums';
import { AvailableDZapServices, BridgeParamsRequest, HexString, SwapData } from 'src/types';
import { calcTotalSrcTokenAmount, isDZapNativeToken, isOneToMany, writeContract } from 'src/utils';
import { checkPermit2, getPermit2PermitDataForApprove } from 'src/utils/permit/permit2Methods';
import { Abi, WalletClient, erc20Abi, maxUint256 } from 'viem';
import ContractHandler from '.';

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
    data: SwapData[] | BridgeParamsRequest[];
    rpcUrls: string[];
  }) {
    if (data.length > 1 && isOneToMany(data[0].srcToken, data[1].srcToken)) {
      // handle one to many case
      const srcTokenAddress = data[0].srcToken as HexString;
      if (isDZapNativeToken(srcTokenAddress)) {
        return {
          status: TxnStatus.success,
          code: StatusCodes.Success,
          data: {
            tokenAllowances: {
              [srcTokenAddress]: maxUint256,
            },
            noOfApprovalsRequired: 0,
            noOfSignaturesRequired: 0,
          },
        };
      }
      const totalSrcAmount = calcTotalSrcTokenAmount(data);
      const {
        status,
        code,
        data: { permitAllowance },
      } = await checkPermit2({
        chainId,
        srcToken: srcTokenAddress,
        rpcUrls,
        userAddress: sender,
      });
      return {
        status,
        code,
        data: {
          tokenAllowances: {
            [srcTokenAddress]: permitAllowance,
          },
          noOfApprovalsRequired: permitAllowance < totalSrcAmount ? 1 : 0,
          noOfSignaturesReq: 1,
        },
      };
    }
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
    sender,
    rpcUrls,
    data,
    approvalTxnCallback,
  }: {
    chainId: number;
    signer: WalletClient;
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
      txnDetails = await writeContract({
        chainId,
        contractAddress: data[dataIdx].srcToken as HexString,
        abi: erc20Abi as Abi,
        functionName: Erc20Functions.approve,
        args: [PERMIT2_ADDRESS, data[dataIdx].amountToApprove],
        userAddress: sender,
        rpcUrls,
        signer,
      });
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
    service,
    signer,
    signatureCallback,
  }: {
    chainId: number;
    sender: string;
    data: SwapData[] | BridgeParamsRequest[];
    rpcUrls?: string[];
    signer: WalletClient;
    service: AvailableDZapServices;
    signatureCallback?: () => Promise<void>;
  }) {
    if (data.length === 0) return;
    const oneToMany = data.length > 1 && isOneToMany(data[0].srcToken, data[1].srcToken);
    let totalSrcAmount = BigInt(0);
    if (oneToMany) totalSrcAmount = calcTotalSrcTokenAmount(data);
    const dzapContractAddress = this.contractHandler.getDZapContractAddress({ chainId, service });
    if (isDZapNativeToken(data[0].srcToken)) {
      data[0].permitData = DEFAULT_PERMIT_DATA;
    } else {
      const { status, code, permitData } = await getPermit2PermitDataForApprove({
        chainId,
        account: sender as HexString,
        token: data[0].srcToken as HexString,
        dzapContractAddress,
        amount: oneToMany ? totalSrcAmount : BigInt(data[0].amount),
        signer,
        rpcUrls,
      });
      if (status === TxnStatus.success) {
        data[0].permitData = permitData;
        if (signatureCallback) await signatureCallback();
      } else {
        return { status, code, data: null };
      }
    }
    for (let dataIdx = 1; dataIdx < data.length; dataIdx++) {
      let permitData = DEFAULT_PERMIT_DATA;
      if (!isDZapNativeToken(data[dataIdx].srcToken)) {
        if (oneToMany) {
          permitData = PERMIT2_APPROVE_DATA;
        } else {
          const {
            status,
            code,
            permitData: permit2ApprovePermitData,
          } = await getPermit2PermitDataForApprove({
            chainId,
            account: sender as HexString,
            token: data[dataIdx].srcToken as HexString,
            dzapContractAddress,
            amount: oneToMany ? totalSrcAmount : BigInt(data[dataIdx].amount),
            signer,
            rpcUrls,
          });
          if (status === TxnStatus.success) {
            permitData = permit2ApprovePermitData;
            if (signatureCallback) await signatureCallback();
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
