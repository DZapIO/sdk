import Axios, { CancelToken } from 'axios';
import { baseUrl } from '../config';
import { QuoteRateRequest, SwapParamRequest } from '../types';

const invoke = (endpoint: string, data: any, method?: any, cancelToken?: CancelToken): Promise<any> => {
  const url = `${baseUrl}${endpoint}`;
  return Axios({
    method: method || 'post',
    url,
    data,
    cancelToken,
  })
    .then(({ data }) => data)
    .catch((error) => {
      if (Axios.isCancel(error)) {
        return Promise.resolve({});
      }
      return Promise.reject(error);
    });
};

export const fetchQuoteRate = (request: QuoteRateRequest, cancelToken: CancelToken) =>
  invoke('swap/quote', request, 'post', cancelToken);

export const fetchSwapParams = (request: SwapParamRequest) => {
  return invoke('swap/params', request);
};

export const fetchAllSupportedChains = (chainId: number) => {
  return invoke('config/supported-chains', {
    chainId,
  });
};
