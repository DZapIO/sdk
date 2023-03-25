import { ethers, Signer } from "ethers";
import { fetchSwapParams } from "../api";
import { registry } from "../config/registry";
import { Request } from "../types";
import { getChecksumAddress } from "../utils";
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
  const getContractAddress = (): string => {
    try {
      const address = registry.contractAddresses?.[chainId] || undefined;
      return getChecksumAddress(address);
    } catch {
      throw new Error("Unsupported chainId");
    }
  };

  const getContract = (): any => {
    try {
      return new ethers.Contract(getContractAddress(), registry.abi, provider);
    } catch (error) {
      throw error;
    }
  };

  const swap = async (
    {
      request,
      recipient,
      nftId,
    }: {
      request: Request[];
      recipient: string;
      nftId?: number;
    },
    trxSpeed?: "low" | "medium" | "high"
  ): Promise<any> => {
    try {
      const method = registry.methods.batchSwap;
      const contract = getContract();
      const { ercSwapDetails, value } = await fetchSwapParams(request, chainId);
      const params = [ercSwapDetails, recipient, clientId || 0, nftId || 0];
      const networkFee = await getNetworkFee(chainId);
      const result = await contract[method](...params, {
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
