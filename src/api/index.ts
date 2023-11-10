import Axios from "axios";
import { baseUrl } from "../config";
import { QuoteRateRequest, SwapParamRequest } from "../types";

const invoke = (endpoint: string, data: any, method?: any): Promise<any> => {
  const url = `${baseUrl}${endpoint}`;
  return Axios({
    method: !!method ? method : "put",
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
  const resp = await invoke("batch-swap/get-quote", {
    chainId,
    request,
  });
  return resp;
};

export const fetchSwapParams = (
  request: SwapParamRequest[],
  chainId: number,
  via?: string
) => {
  return invoke("swap/get-params/v2", {
    chainId,
    request,
    via,
  });
};

export const fetchAllSupportedChains = (chainId: number) => {
  return invoke("config/supported-chains", {
    chainId,
  });
};
