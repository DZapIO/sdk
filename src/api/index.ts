import Axios from "axios";
import { baseUrl } from "../config";
import { Request } from "../types";

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
  request: Request[],
  chainId: number,
  version: string
) => {
  return await invoke("swap/get-path", {
    chainId,
    version,
    requests: request,
  });
};

export const fetchSwapParams = (
  request: Request[],
  chainId: number,
  version: string
) => {
  return invoke("swap/get-params", {
    chainId,
    version,
    swapParams: request,
  });
};

export const fetchAllSupportedChains = (chainId: number) => {
  return invoke("config/supported-chains", {
    chainId,
  });
};
