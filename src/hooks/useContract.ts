import { SWAP_CONTRACTS, Chains } from 'src/config';
import { HexString, SwapParamRequest } from 'src/types';
import { fetchSwapParams } from '../api';
import { getChecksumAddress, initializeReadOnlyProvider, purgeSwapVersion } from '../utils';
import { Client, WalletClient, decodeFunctionData, getContract as fetchContract } from 'viem';
import BigNumber from 'bignumber.js';
import { Signer } from 'ethers';

export const estimateGasMultiplier = BigNumber(15).dividedBy(10); // .toFixed(0);

function isTypeSigner(variable: any): variable is Signer {
  return variable instanceof Signer;
}

function useContract({ chainId, signer }: { chainId: number; signer: WalletClient | Signer; clientId?: number }) {
  const getContractAddress = (version?: string): HexString => {
    try {
      const address = SWAP_CONTRACTS[purgeSwapVersion(version)][chainId];
      return getChecksumAddress(address);
    } catch (err) {
      throw new Error('Unsupported chainId');
    }
  };

  const getContract = (version?: string): any => {
    const purgedVersion = purgeSwapVersion(version);
    const abi = SWAP_CONTRACTS[purgedVersion].abi;
    const contractAddress = getContractAddress(purgedVersion);
    const contract = fetchContract({
      abi,
      address: contractAddress,
      client: signer as Client,
    });

    return contract;
  };
  const swap = async ({ request }: { request: SwapParamRequest }): Promise<any> => {
    try {
      const { data: paramResponseData } = await fetchSwapParams(request);
      console.log(JSON.stringify(paramResponseData));
      const {
        transactionRequest: { data, from, to, value, gasLimit },
      } = paramResponseData;
      //simulate transaction
      /*
      @audit All these because of the simulateContract function requiring the function name and arguments to be passed. 
      const publicClient = initializeReadOnlyProvider(chainId);
      const purgedVersion = purgeSwapVersion();
      const contractAddress = getContractAddress(purgedVersion);
      const abi = SWAP_CONTRACTS[purgedVersion].abi;
      const { functionName, args } = decodeFunctionData({
        abi: abi,
        data: data,
      });
      */
      /*
      @audit Typecasting incase the bigint values fromAmount and minToAmount are not being handled correctly.
      const contractArguments = [
        args[0],
        args[1],
        args[2],
        args[3],
        {
          callTo: (args[4] as any)?.callTo,
          approveTo: (args[4] as any)?.approveTo,
          from: (args[4] as any)?.from,
          to: (args[4] as any)?.to,
          fromAmount: (args[4] as any)?.fromAmount.toString(),
          minToAmount: (args[4] as any)?.minToAmount.toString(),
          swapCallData: (args[4] as any)?.swapCallData,
          permit: (args[4] as any)?.permit,
        },
      ];
      */

      /*
      const { request: resp } = await publicClient.simulateContract({
        address: contractAddress,
        abi: abi,
        account: from,
        value: value,
        functionName: functionName,
        args: contractArguments, //Are compulsory... if input is there.
      });
      */

      // @audit ethers gas estimation code segment
      // const provider = new ethers.providers.JsonRpcProvider(
      //   'https://arb-mainnet.g.alchemy.com/v2/HxHVTDRB9UrZQNXBHC2tigcAAk03i7bb', //Arbitrum
      // );
      // const resp = await provider.estimateGas({
      //   // Wrapped ETH address
      //   to,

      //   // `function deposit() payable`
      //   data: data,

      //   // 1 ether
      //   value: value,
      // });
      // Add gasPrice : fast, medium, slow
      // Check if the signer is instance of Signer class from ethers. 
      if (isTypeSigner(signer)) {
        console.log('In ethers signer.');
        const response = await signer.sendTransaction({
          from,
          to,
          data,
          value,
          gasLimit,
        });
        return response.hash;
      } else {
        console.log('In viem walletClient.');
        const hash = await signer.sendTransaction({
          chain: Chains[chainId],
          account: from as HexString,
          to: to as HexString,
          data: data as HexString,
          value: value as bigint,
          // gasLimit,
        });
        return hash;
      }
    } catch (err) {
      throw { error: err };
    }
  };
  return {
    swap,
    getContractAddress,
    getContract,
  };
}
export default useContract;
