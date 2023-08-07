import Axios from "axios";
import { baseUrl } from "../config";
import { QuoteRateRequest, SwapParamRequest } from "../types";

const invoke = (endpoint: string, data: any): Promise<any> => {
  const url = `${baseUrl}${endpoint}`;
  return Axios({
    method: "put",
    url,
    data,
  })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error));
};

export const fetchQuoteRate = async (
  request: QuoteRateRequest[],
  chainId: number
) => {
  return await invoke("swap/get-quote", {
    chainId,
    request,
  });
};

export const fetchSwapParams = (
  request: SwapParamRequest[],
  chainId: number
) => {
  return invoke("swap/get-params/v2", {
    chainId,
    request,
  });
};

export const fetchAllSupportedChains = (chainId: number) => {
  return invoke("config/supported-chains", {
    chainId,
  });
};
