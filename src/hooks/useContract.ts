import { BRIDGE_ABIS, Chains, SWAP_ABIS } from 'src/config';
import { SwapParamsRequest, HexString, BridgeParamsRequest, BridgeParamsResponse } from 'src/types';
import { fetchBridgeParams, fetchSwapParams } from '../api';
import { initializeReadOnlyProvider, purgeBridgeVersion, purgeSwapVersion } from '../utils';
import { WalletClient, decodeFunctionData } from 'viem';
import { Signer } from 'ethers';
import { handleTransactionError } from 'src/utils/errors';

export const estimateGasMultiplier = BigInt(15) / BigInt(10); // .toFixed(0);

function isTypeSigner(variable: any): variable is Signer {
  return variable instanceof Signer;
}

function useContract({ chainId, rpcProvider, signer }: { chainId: number; rpcProvider: string; signer: WalletClient | Signer; clientId?: number }) {
  const swap = async ({ request }: { request: SwapParamsRequest }) => {
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
      });
      if (isTypeSigner(signer)) {
        console.log('Using ethers signer.');
        return await signer.sendTransaction({
          from,
          to,
          data,
          value,
          gasLimit,
        });
      } else {
        console.log('Using viem walletClient.');
        return await signer.sendTransaction({
          chain: Chains[chainId],
          account: from as HexString,
          to: to as HexString,
          data: data as HexString,
          value: value as bigint,
          gasLimit,
        });
      }
    } catch (error: any) {
      handleTransactionError({ abi, error });
    }
  };

  const bridge = async ({ request }: { request: BridgeParamsRequest[] }) => {
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
      });
      if (isTypeSigner(signer)) {
        console.log('Using ethers signer.');
        const txResponse = await signer.sendTransaction({
          from,
          to,
          data,
          value,
          gasLimit,
        });
        return {
          txResponse,
          additionalInfo,
        };
      } else {
        console.log('Using viem walletClient.');
        const txHash = await signer.sendTransaction({
          chain: Chains[chainId],
          account: from as HexString,
          to: to as HexString,
          data: data as HexString,
          value: BigInt(value),
          gasLimit,
        });
        return {
          txHash,
          additionalInfo,
        };
      }
    } catch (error: any) {
      console.log({ error });
      handleTransactionError({ abi, error });
    }
  };
  return {
    swap,
    bridge,
  };
}
export default useContract;
