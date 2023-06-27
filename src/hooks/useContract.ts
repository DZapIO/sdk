import { ethers, Signer } from "ethers";
import { SWAP_CONTRACTS } from "src/config";
import { Contract } from "zksync-web3";
import { fetchSwapParams } from "../api";
import { Request } from "../types";
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
      const address =
        SWAP_CONTRACTS[purgeSwapVersion(version)]?.[this.chainId] || undefined;
      return getChecksumAddress(address);
    } catch {
      throw new Error("Unsupported chainId");
    }
  };

  const getContract = (version?: string): any => {
    try {
      const purgedVersion = purgeSwapVersion(version);
      const abiPath = SWAP_CONTRACTS[purgedVersion].abi;
      const { abi } = require(`../artifacts/${abiPath}`);
      return chainId === 324
        ? new Contract('0x3cd8a926f8a967d315768749a38dc7c7d80c47bF', abi, provider)
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
      request: Request[];
      recipient: string;
      nftId?: number;
      version?: string;
    },
    trxSpeed?: "low" | "medium" | "high"
  ): Promise<any> => {
    try {
      const method = "swapTokensToTokens";
      const contract = this.getContract(version);
      const { ercSwapDetails, value } = await fetchSwapParams(
        request,
        chainId,
        purgeSwapVersion(version)
      );
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
