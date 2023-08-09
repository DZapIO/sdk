import { ethers, Signer } from "ethers";
import { SWAP_CONTRACTS } from "src/config";
import { SwapParamRequest } from "src/types";
import { Contract } from "zksync-web3";
import { fetchSwapParams } from "../api";
import { getChecksumAddress, purgeSwapVersion } from "../utils";
import { getNetworkFee } from "../utils/GasFee";

function useContract({
  chainId,
  provider,
  clientId,
}: {
  chainId: number;
  provider: Signer;
  clientId?: number;
}) {
  const getContractAddress = (version?: string): string => {
    try {
      const address = SWAP_CONTRACTS[purgeSwapVersion(version)][chainId];
      return getChecksumAddress(address);
    } catch (err) {
      throw new Error("Unsupported chainId");
    }
  };

  const getContract = (version?: string): any => {
    try {
      const purgedVersion = purgeSwapVersion(version);
      const abi = SWAP_CONTRACTS[purgedVersion].abi;
      return chainId === 324
        ? new Contract(getContractAddress(purgedVersion), abi, provider)
        : new ethers.Contract(getContractAddress(purgedVersion), abi, provider);
    } catch (error) {
      throw error;
    }
  };
  const swap = async (
    {
      request,
      recipient,
      nftId,
      version,
    }: {
      request: SwapParamRequest[];
      recipient: string;
      nftId?: number;
      version?: string;
    },
    trxSpeed?: "low" | "medium" | "high"
  ): Promise<any> => {
    try {
      const contract = getContract(version);
      const { swapDetails, value } = await fetchSwapParams(request, chainId);
      const params = [swapDetails, recipient, clientId || 0];
      const networkFee = await getNetworkFee(chainId);
      const result = await contract.swapTokensToTokens2(...params, {
        gasPrice: networkFee[trxSpeed || "medium"],
        value,
      });
      return result;
    } catch (err) {
      throw err;
    }
  };
  return {
    swap,
    getContractAddress,
    getContract,
  };
}
export default useContract;
