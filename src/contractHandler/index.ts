import { fetchBridgeParams, fetchSwapParams } from 'src/api';
import { BRIDGE_ABIS, SWAP_ABIS } from 'src/config';
import { ConnectorType, PermitSelector, Services, StatusCodes, TxnStatus } from 'src/enums';
import { getDZapContractAddress } from 'src/utils/contract';
import { getAllowanceAndTokenPermit as getApprovalAndPermitUsed, getPermitDetails } from 'src/utils/permit';
import { decodeFunctionData } from 'viem';
import { BridgeParamsRequest, BridgeParamsResponse, HexString, SwapData, SwapParamsRequest } from '../types';
import { getWalletClient, initializeReadOnlyProvider, purgeBridgeVersion, purgeSwapVersion, viemchainsById } from '../utils';
import { handleTransactionError } from '../utils/errors';

class ContractHandler {
  private static instance: ContractHandler;
  private wcProjectId: string;
  // private constructor() {}

  public static getInstance(wcProjectId: string = ''): ContractHandler {
    if (!ContractHandler.instance) {
      ContractHandler.instance = new ContractHandler();
      this.instance.wcProjectId = wcProjectId;
    }
    return ContractHandler.instance;
  }

  public async handleSwap({
    chainId,
    rpcProvider,
    request,
    connectorType = ConnectorType.injected,
  }: {
    chainId: number;
    rpcProvider: string;
    request: SwapParamsRequest;
    connectorType: ConnectorType;
  }) {
    const purgedVersion = purgeSwapVersion();
    const abi = SWAP_ABIS[purgedVersion].abi;
    try {
      const { data: paramResponseData } = await fetchSwapParams(request);
      const {
        transactionRequest: { data, from, to, value, gasLimit },
      } = paramResponseData;
      //simulate transaction
      const publicClient = initializeReadOnlyProvider({
        chainId,
        rpcProvider,
      });
      const { functionName, args } = decodeFunctionData({
        abi: abi,
        data: data,
      });
      await publicClient.simulateContract({
        address: to,
        abi: abi,
        account: from,
        value: value,
        functionName: functionName,
        args: args, //Are compulsory... if input is there.
        gas: gasLimit,
      });
      const walletClient = await getWalletClient({
        chainId,
        account: from as HexString,
        connectorType,
        wcProjectId: this.wcProjectId,
      });
      return await walletClient.sendTransaction({
        chain: viemchainsById[chainId],
        account: from as HexString,
        to: to as HexString,
        data: data as HexString,
        value: value as bigint,
        gasLimit,
      });
    } catch (error: any) {
      console.log({ error });
      handleTransactionError({ abi, error });
    }
  }

  public async handleBridge({
    chainId,
    rpcProvider,
    request,
    connectorType,
  }: {
    chainId: number;
    rpcProvider: string;
    request: BridgeParamsRequest[];
    connectorType: ConnectorType;
  }) {
    const purgedVersion = purgeBridgeVersion();
    const abi = BRIDGE_ABIS[purgedVersion].abi;
    try {
      const paramResponseData = (await fetchBridgeParams(request)) as BridgeParamsResponse;
      const { data, from, to, value, gasLimit, additionalInfo } = paramResponseData;
      //simulate transaction
      const publicClient = initializeReadOnlyProvider({
        chainId,
        rpcProvider,
      });
      const { functionName, args } = decodeFunctionData({
        abi: abi,
        data: data,
      });
      await publicClient.simulateContract({
        address: to,
        abi: abi,
        account: from,
        value: value,
        functionName: functionName,
        args: args,
        gas: gasLimit,
      });
      console.log('Creating viem walletClient.');
      const walletClient = await getWalletClient({
        chainId,
        account: from as HexString,
        connectorType,
        wcProjectId: this.wcProjectId,
      });
      const txnHash = await walletClient.sendTransaction({
        chain: viemchainsById[chainId],
        account: from as HexString,
        to: to as HexString,
        data: data as HexString,
        value: BigInt(value),
        gasLimit,
      });
      return {
        txnHash,
        additionalInfo,
      };
    } catch (error: any) {
      console.log({ error });
      handleTransactionError({ abi, error });
    }
  }

  public async handleGetApprovalAndPermitSelector({
    chainId,
    sender,
    data,
    rpcProvider,
    connectorType,
    service,
    afterPermit2ApprovalTxnCallback,
    afterAllowanceCheckCallback,
  }: {
    chainId: number;
    sender: string;
    data: SwapData[] | BridgeParamsRequest[];
    rpcProvider: string;
    connectorType: ConnectorType;
    service: Services;
    afterPermit2ApprovalTxnCallback?: ({ txnHash }: { txnHash: HexString }) => Promise<void>;
    afterAllowanceCheckCallback?: () => Promise<void>;
  }) {
    const dzapContractAddress = getDZapContractAddress(chainId, service);
    if (data.length > 1 && data[0].srcToken.toLowerCase() === data[1].srcToken.toLowerCase()) {
      // handle one to many in case of same non-native srcToken
      const sum = data.reduce((acc, obj) => {
        return acc + BigInt(obj.amount);
      }, BigInt(0));
      const { status, code, permitUsed } = await getApprovalAndPermitUsed({
        chainId,
        srcToken: data[0].srcToken,
        amount: sum.toString(),
        rpcProvider,
        userAddress: sender as HexString,
        dzapContractAddress,
        connectorType,
        afterPermit2ApprovalTxnCallback,
        wcProjectId: this.wcProjectId,
      });
      let permitSelector = PermitSelector.DefaultPermit;
      if (permitUsed === PermitSelector.Permit1) {
        permitSelector = PermitSelector.Permit1;
      } else if (permitUsed === PermitSelector.Permit2) {
        permitSelector = PermitSelector.Permit2Approve;
      }
      const permitSelectorForSrcTokens = new Array(data.length).fill(permitSelector);
      if (permitUsed === PermitSelector.Permit2) {
        permitSelectorForSrcTokens[0] = PermitSelector.Permit2;
      }
      await afterAllowanceCheckCallback(); // TODO: Callback to update UI for each src token should be given or not?
      return { status, code, permitSelectorForSrcTokens };
    }
    const permitSelectorForSrcTokens = new Array(data.length);
    for (let dataIdx = 0; dataIdx < data.length; dataIdx++) {
      const { srcToken, amount } = data[dataIdx];
      const { status, code, permitUsed } = await getApprovalAndPermitUsed({
        chainId,
        srcToken,
        amount,
        rpcProvider,
        userAddress: sender as HexString,
        dzapContractAddress,
        connectorType,
        afterPermit2ApprovalTxnCallback,
        wcProjectId: this.wcProjectId,
      });
      if (status === TxnStatus.success) {
        permitSelectorForSrcTokens[dataIdx] = permitUsed;
        await afterAllowanceCheckCallback(); // Callback to update UI for each src token
      } else {
        return { status, code, permitSelectorForSrcTokens: null };
      }
    }
    return { status: TxnStatus.success, permitSelectorForSrcTokens: permitSelectorForSrcTokens };
  }

  public async handleGetPermitData({
    chainId,
    data,
    rpcProvider,
    sender,
    service,
    permitSelectorForSrcTokens,
    connectorType,
  }: {
    chainId: number;
    sender: string;
    data: SwapData[] | BridgeParamsRequest[];
    rpcProvider: string;
    connectorType: ConnectorType;
    service: Services;
    permitSelectorForSrcTokens: PermitSelector[];
  }) {
    if (permitSelectorForSrcTokens.length !== data.length) {
      throw new Error('Permit selector length mismatch');
    }
    const dzapContractAddress = getDZapContractAddress(chainId, service);
    for (let dataIdx = 0; dataIdx < data.length; dataIdx++) {
      const { permitData, status, code } = await getPermitDetails({
        permitSelector: permitSelectorForSrcTokens[dataIdx],
        chainId,
        sender: sender as HexString,
        srcToken: data[dataIdx].srcToken,
        dzapContractAddress,
        amount: data[dataIdx].amount,
        connectorType,
        rpcProvider,
        wcProjectId: this.wcProjectId,
      });

      if (status === TxnStatus.success) {
        data[dataIdx].permitData = permitData;
      } else {
        return { status, code, data: null };
      }
    }

    return { status: TxnStatus.success, data, code: StatusCodes.Success };
  }
}

export default ContractHandler;
