import { fetchBridgeParams, fetchSwapParams } from 'src/api';
import { BRIDGE_ABIS, SWAP_ABIS } from 'src/config';
import { DEFAULT_PERMIT1_DATA, DEFAULT_PERMIT2_APPROVE_DATA, NATIVE_TOKEN_ADDRESS } from 'src/constants';
import { ConnectorType, PermitFunctionSelectorCases, Services, TxnStatus } from 'src/enums';
import { getDZapContractAddress } from 'src/utils/contract';
import { getPermitdata } from 'src/utils/permit';
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

  public async handlePermit({
    chainId,
    sender,
    data,
    rpcProvider,
    connectorType,
    service,
  }: {
    chainId: number;
    sender: string;
    data: SwapData[] | BridgeParamsRequest[];
    rpcProvider: string;
    connectorType: ConnectorType;
    service: Services;
  }) {
    const dzapContractAddress = getDZapContractAddress(chainId, service);
    if (
      data.length > 1 &&
      data[0].srcToken !== NATIVE_TOKEN_ADDRESS.toLowerCase() &&
      data[0].srcToken.toLowerCase() === data[1].srcToken.toLowerCase()
    ) {
      // handle one to many in case of same non-native srcToken
      const sum = data.reduce((acc, obj) => {
        return acc + BigInt(obj.amount);
      }, BigInt(0));
      const { status, permitData, code, permitUsed } = await getPermitdata({
        chainId,
        srcToken: data[0].srcToken,
        amount: sum.toString(),
        rpcProvider,
        userAddress: sender as HexString,
        dzapContractAddress,
        connectorType,
        wcProjectId: this.wcProjectId,
      });
      if (permitUsed === PermitFunctionSelectorCases.checkPermit1) {
        data.forEach((obj: SwapData | BridgeParamsRequest) => {
          obj.permitData = DEFAULT_PERMIT1_DATA;
        });
      } else {
        data.forEach((obj: SwapData | BridgeParamsRequest) => {
          obj.permitData = DEFAULT_PERMIT2_APPROVE_DATA;
        });
      }
      if (status === TxnStatus.success) {
        data[0].permitData = permitData;
      } else {
        return { status, code, data: null };
      }
    } else {
      for (let dataIdx = 0; dataIdx < data.length; dataIdx++) {
        const { srcToken, amount } = data[dataIdx];
        const { status, permitData, code } = await getPermitdata({
          chainId,
          srcToken,
          amount,
          rpcProvider,
          userAddress: sender as HexString,
          dzapContractAddress,
          connectorType,
          wcProjectId: this.wcProjectId,
        });
        if (status === TxnStatus.success) {
          data[dataIdx].permitData = permitData;
        } else {
          return { status, code, data: null };
        }
      }
    }
    return { status: TxnStatus.success, data };
  }
}

export default ContractHandler;
