import { fetchBridgeParams, fetchSwapParams } from 'src/api';
import { BRIDGE_ABIS, Chains, SWAP_ABIS } from 'src/config';
import { ConnectorType } from 'src/enums';
import { decodeFunctionData } from 'viem';
import { BridgeParamsRequest, BridgeParamsResponse, HexString, SwapParamsRequest } from '../types';
import { getWalletClient, initializeReadOnlyProvider, purgeBridgeVersion, purgeSwapVersion } from '../utils';
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
        chain: Chains[chainId],
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
        chain: Chains[chainId],
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
}

export default ContractHandler;
