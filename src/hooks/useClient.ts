import { purgeSwapVersion } from "src/utils";
import {
  fetchAllSupportedChains,
  fetchQuoteRate,
  fetchSwapParams,
} from "../api";
import { Request } from "../types";

function useClient({ chainId }: { chainId: number }) {
  const getQuoteRate = async (request: Request[], version?: string) => {
    return await fetchQuoteRate(request, chainId, purgeSwapVersion(version));
  };

  const getSwapParams = (request: Request[], version?: string) => {
    return fetchSwapParams(request, chainId, purgeSwapVersion(version));
  };

  const getAllSupportedChains = () => {
    return fetchAllSupportedChains(chainId);
  };

  return {
    getQuoteRate,
    getSwapParams,
    getAllSupportedChains,
  };
}
export default useClient;
