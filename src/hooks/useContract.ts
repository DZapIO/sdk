import { SWAP_CONTRACTS, Chains } from 'src/config';
import { HexString, SwapParamRequest } from 'src/types';
import { fetchSwapParams } from '../api';
import { getChecksumAddress, purgeSwapVersion } from '../utils';
import { Client, WalletClient, getContract as fetchContract } from 'viem';
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
      const {
        transactionRequest: { data, from, to, value, gasLimit },
      } = paramResponseData;
      if (isTypeSigner(signer)) {
        // Add gasPrice : fast, medium, slow
        return await signer.sendTransaction({
          from,
          to,
          data,
          value,
          gasLimit,
        });
      } else {
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
