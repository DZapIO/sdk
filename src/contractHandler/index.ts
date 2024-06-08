import { fetchBridgeParams, fetchSwapParams } from 'src/api';
import { WalletClient, decodeFunctionData } from 'viem';
import { BridgeParamsRequest, BridgeParamsResponse, HexString, SwapParamsRequest } from '../types';
import { getDZapAbi, initializeReadOnlyProvider, isTypeSigner, wagmiChainsById } from '../utils';
import { handleTransactionError } from '../utils/errors';
import { Signer } from 'ethers';
import { Services } from 'src/enums';

class ContractHandler {
  private static instance: ContractHandler;
  // private constructor() {}

  public static getInstance(): ContractHandler {
    if (!ContractHandler.instance) {
      ContractHandler.instance = new ContractHandler();
    }
    return ContractHandler.instance;
  }

  public async handleSwap({
    chainId,
    rpcProvider,
    request,
    signer,
  }: {
    chainId: number;
    rpcProvider: string;
    request: SwapParamsRequest;
    signer: Signer | WalletClient;
  }) {
    const abi = getDZapAbi(Services.BatchSwap);
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
      return await signer.sendTransaction({
        chain: wagmiChainsById[chainId],
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
    signer,
  }: {
    chainId: number;
    rpcProvider: string;
    request: BridgeParamsRequest[];
    signer: Signer | WalletClient;
  }) {
    const abi = getDZapAbi(Services.CrossChain);
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

      if (isTypeSigner(signer)) {
        console.log('Using ethers signer.');
        const txnRes = await signer.sendTransaction({
          from,
          to,
          data,
          value,
          gasLimit,
        });
        return {
          txnHash: txnRes.hash,
          additionalInfo,
        };
      } else {
        console.log('Using viem walletClient.');
        const txnHash = await signer.sendTransaction({
          chain: wagmiChainsById[chainId],
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
      }
    } catch (error: any) {
      console.log({ error });
      handleTransactionError({ abi, error });
    }
  }
}

export default ContractHandler;
