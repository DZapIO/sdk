import Axios, { CancelToken } from 'axios';
import { baseUrl } from '../config';
import { QuoteRateRequest, SwapParamRequest } from '../types';

const quoteCancelToken = Axios.CancelToken.source();

const invoke = (endpoint: string, data: any, method?: any, cancelToken? : CancelToken ): Promise<any> => {
  const url = `${baseUrl}${endpoint}`;
  return Axios({
    method: method ? method : 'post',
    url,
    data,
    cancelToken: cancelToken
  })
    .then(({ data }) => data)
    .catch((error) => Promise.reject(error));
};

export const fetchQuoteRate = (request: QuoteRateRequest) => {
  quoteCancelToken.cancel();
  return invoke('swap/quote', request, quoteCancelToken);
};

export const fetchSwapParams = (request: SwapParamRequest) => {
  return invoke('swap/params', request);
};

export const fetchAllSupportedChains = (chainId: number) => {
  return invoke('config/supported-chains', {
    chainId,
  });
};
