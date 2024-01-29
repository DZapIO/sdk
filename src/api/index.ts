import Axios from 'axios';
import { baseUrl } from '../config';
import { QuoteRateRequest, SwapParamRequest } from '../types';

const invoke = (endpoint: string, data: any, method?: any): Promise<any> => {
  const url = `${baseUrl}${endpoint}`;
  return Axios({
    method: method ? method : 'post',
    url,
    data,
  })
    .then(({ data }) => data)
    .catch((error) => {
      console.log('Error is here: ', JSON.stringify(error.response.data));
      return Promise.reject(error);
    });
};

export const fetchQuoteRate = (request: QuoteRateRequest) => {
  return invoke('swap/quote', request);
};

export const fetchSwapParams = (request: SwapParamRequest) => {
  return invoke('swap/params', request);
};

export const fetchAllSupportedChains = (chainId: number) => {
  return invoke('config/supported-chains', {
    chainId,
  });
};
