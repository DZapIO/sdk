import {
  fetchAllSupportedChains,
  fetchQuoteRate,
  fetchSwapParams,
} from "../api";
import { Request } from "../types";

function useClient({ chainId }: { chainId: number }) {
  const getQuoteRate = async (request: Request[]) => {
    return await fetchQuoteRate(request, chainId);
  };

  const getSwapParams = (request: Request[]) => {
    return fetchSwapParams(request, chainId);
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
