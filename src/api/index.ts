import Axios from "axios";
import { baseUrl } from "../config";
import { QuoteRateRequest, SwapParamRequest } from "../types";

const invoke = (endpoint: string, data: any, method?: any): Promise<any> => {
  const url = `${baseUrl}${endpoint}`;
  return Axios({
    method: !!method ? method : "post",
    url,
    data,
  })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error));
};

export const fetchQuoteRate = (
  request: QuoteRateRequest[],
  chainId: number
) => {
  return invoke("swap/quote", {
    chainId,
    request,
  });
};

export const fetchSwapParams = (
  request: SwapParamRequest[],
  chainId: number,
  via?: string
) => {
  return invoke("swap/params", {
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
