import { PERMIT2_ADDRESS } from 'src/constants';
import { PermitSelector, TxnStatus, StatusCodes, Erc20Functions } from 'src/enums';
import { SwapData, BridgeParamsRequest, HexString, PermitSelectorData, AvailableDZapServices } from 'src/types';
import { isOneToMany, calcTotalSrcTokenAmount, writeContract } from 'src/utils';
import { getAllowanceAndTokenPermit, getPermitDetails } from 'src/utils/permit/permit';
import { WalletClient, maxUint256, erc20Abi, Abi } from 'viem';
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
      // handle one to many in case of non-native srcToken
      const srcTokenAddress = data[0].srcToken as HexString;
      const totalSrcAmount = calcTotalSrcTokenAmount(data);
      const {
        status,
        code,
        data: { permitSelector, permitAllowance },
      } = await getAllowanceAndTokenPermit({
        chainId,
        srcToken: srcTokenAddress,
        rpcUrls,
        userAddress: sender,
      });
      const isPermit1 = permitSelector === PermitSelector.Permit1;
      const isPermit2Approve = permitSelector === PermitSelector.Permit2Approve;
      const permitSelectorData = data.map((_: unknown, idx: number) => {
        return {
          address: srcTokenAddress,
          //Case 1: index > 0 and permit1 -> (Default Permit)
          //Case 2: index > 0 and permit2Approve -> Permit2Approve
          //Case 3: index > 0 and (default permit: native token) -> (default permit)
          // Case 4: index == 0 and permit2Approve -> permit2
          // Case 5: index== 0 and permit1 -> permit1
          // Case 6: index == 0 and (default permit: native token) -> (default permit)
          permitSelector:
            idx > 0 ? (isPermit1 ? PermitSelector.DefaultPermit : permitSelector) : isPermit2Approve ? PermitSelector.Permit2 : permitSelector,
          permitAllowance,
        };
      });
      return { status, code, data: { permitSelectorData, noOfApprovalsRequired: permitAllowance < totalSrcAmount ? 1 : 0 } };
    }
    // other cases like many to one or one to one
    let noOfApprovalsRequired = 0;
    const permitSelectorData: PermitSelectorData[] = [];
    for (let dataIdx = 0; dataIdx < data.length; dataIdx++) {
      const { srcToken, amount } = data[dataIdx];
      const {
        status,
        code,
        data: { permitSelector, permitAllowance },
      } = await getAllowanceAndTokenPermit({
        chainId,
        srcToken,
        rpcUrls,
        userAddress: sender as HexString,
      });
      if (permitAllowance < BigInt(amount)) {
        noOfApprovalsRequired++;
      }
      if (status === TxnStatus.success) {
        permitSelectorData.push({
          address: data[dataIdx].srcToken as HexString,
          permitSelector: permitSelector === PermitSelector.Permit2Approve ? PermitSelector.Permit2 : permitSelector,
          permitAllowance,
        });
      } else {
        return { status, code, data: { permitSelectorData, noOfApprovalsRequired } };
      }
    }
    return { status: TxnStatus.success, code: StatusCodes.Success, data: { permitSelectorData, noOfApprovalsRequired } };
  }

  public async getApprovals({
    chainId,
    permitSelectorData,
    signer,
    sender,
    rpcUrls,
    approvalTxnCallback,
  }: {
    chainId: number;
    permitSelectorData: PermitSelectorData[];
    signer: WalletClient;
    sender: HexString;
    rpcUrls?: string[];
    approvalTxnCallback?: ({
      txnDetails,
      address,
    }: {
      txnDetails: { txnHash: string; code: StatusCodes; status: TxnStatus };
      address: HexString;
    }) => Promise<TxnStatus | void>;
  }) {
    if (permitSelectorData.length === 0) return { status: TxnStatus.success, code: StatusCodes.Success, data: { permitData: [] } };
    if (permitSelectorData.length > 1 && isOneToMany(permitSelectorData[0].address, permitSelectorData[1].address)) {
      let txnDetails = { status: TxnStatus.success, code: StatusCodes.Success, txnHash: '' };
      if (permitSelectorData[0].permitAllowance < maxUint256) {
        txnDetails = await writeContract({
          chainId,
          contractAddress: permitSelectorData[0].address as HexString,
          abi: erc20Abi as Abi,
          functionName: Erc20Functions.approve,
          args: [PERMIT2_ADDRESS, maxUint256],
          userAddress: sender,
          rpcUrls,
          signer,
        });
        if (txnDetails.code !== StatusCodes.Success) {
          return {
            status: txnDetails.status,
            code: txnDetails?.code || StatusCodes.Error,
          };
        }
      }
      if (approvalTxnCallback) {
        const callbackStatus = await approvalTxnCallback({ txnDetails, address: permitSelectorData[0].address });
        if (callbackStatus && callbackStatus !== TxnStatus.success) {
          return {
            status: txnDetails.status,
            code: txnDetails?.code || StatusCodes.Error,
          };
        }
      }
      return { status: TxnStatus.success, code: StatusCodes.Success };
    }
    for (let dataIdx = 0; dataIdx < permitSelectorData.length; dataIdx++) {
      let txnDetails = { status: TxnStatus.success, code: StatusCodes.Success, txnHash: '' };
      if (permitSelectorData[dataIdx].permitAllowance < maxUint256) {
        txnDetails = await writeContract({
          chainId,
          contractAddress: permitSelectorData[dataIdx].address as HexString,
          abi: erc20Abi as Abi,
          functionName: Erc20Functions.approve,
          args: [PERMIT2_ADDRESS, maxUint256],
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
      }
      if (approvalTxnCallback) {
        const callbackStatus = await approvalTxnCallback({ txnDetails, address: permitSelectorData[0].address });
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
  public async handleGetPermitData({
    chainId,
    data,
    rpcUrls,
    sender,
    service,
    permitSelectorData,
    signer,
    signatureCallback,
  }: {
    chainId: number;
    sender: string;
    data: SwapData[] | BridgeParamsRequest[];
    rpcUrls?: string[];
    signer: WalletClient;
    service: AvailableDZapServices;
    permitSelectorData: PermitSelectorData[];
    signatureCallback?: () => Promise<void>;
  }) {
    if (permitSelectorData.length !== data.length) {
      throw new Error('Permit selector length mismatch');
    }
    const oneToMany = data.length > 1 && isOneToMany(data[0].srcToken, data[1].srcToken);
    let totalSrcAmount = BigInt(0);
    if (oneToMany) totalSrcAmount = calcTotalSrcTokenAmount(data);

    const dzapContractAddress = this.contractHandler.getDZapContractAddress({ chainId, service });
    for (let dataIdx = 0; dataIdx < data.length; dataIdx++) {
      const { permitData, status, code } = await getPermitDetails({
        permitSelectorData: permitSelectorData[dataIdx],
        chainId,
        sender: sender as HexString,
        srcToken: data[dataIdx].srcToken,
        dzapContractAddress,
        amount: oneToMany ? totalSrcAmount.toString() : data[dataIdx].amount,
        rpcUrls,
        signer,
      });

      if (status === TxnStatus.success) {
        data[dataIdx].permitData = permitData;
        if (signatureCallback) await signatureCallback();
      } else {
        return { status, code, data: null };
      }
    }

    return { status: TxnStatus.success, data, code: StatusCodes.Success };
  }
}

export default PermitHandler;
