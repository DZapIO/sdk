import { CancelToken, Method } from 'axios';
import AxiosClient from 'src/axios';
import { baseApiClient, baseZapApiClient } from 'src/axios/baseClient';
import { apiKey } from 'src/config';
import { GET, POST } from 'src/constants/httpMethods';
import { ExtendedAxiosRequestConfig } from 'src/types/axiosClient';

type Invoke = {
  endpoint: string;
  data?: any;
  method?: Method;
  cancelToken?: CancelToken;
  shouldRetry?: boolean;
  baseClient?: AxiosClient;
};

export const invoke = async ({ endpoint, data, method = POST, cancelToken, shouldRetry = false }: Invoke) => {
  const config: ExtendedAxiosRequestConfig = {
    method,
    url: endpoint,
    data: method === GET ? undefined : data,
    params: method === GET ? data : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'x-api-key': apiKey } : {}),
    },
    cancelToken,
    shouldRetry,
  };
  return baseApiClient(config)
    .then((res) => res.data)
    .catch((error) => {
      return Promise.reject(error);
    });
};

export const invokeZap = async ({ endpoint, data, method = POST, cancelToken, shouldRetry = false }: Invoke) => {
  const config: ExtendedAxiosRequestConfig = {
    method,
    url: endpoint,
    data: method === GET ? undefined : data,
    params: method === GET ? data : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'x-api-key': apiKey } : {}),
    },
    cancelToken,
    shouldRetry,
  };
  return baseZapApiClient(config)
    .then((res) => res.data)
    .catch((error) => {
      return Promise.reject(error);
    });
};
