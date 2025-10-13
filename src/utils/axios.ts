import { CancelToken, Method } from 'axios';
import AxiosClient from '../axios';
import { baseApiClient, baseZapApiClient } from '../axios/baseClient';
import { apiKey as apiKeyEnv } from '../config';
import { GET, POST } from '../constants/httpMethods';
import DZapClient from '../dZapClient';
import { ExtendedAxiosRequestConfig } from '../types/axiosClient';

type Invoke = {
  endpoint: string;
  data?: any;
  method?: Method;
  cancelToken?: CancelToken;
  shouldRetry?: boolean;
  baseClient?: AxiosClient;
};

export const invoke = async ({ endpoint, data, method = POST, cancelToken, shouldRetry = false }: Invoke) => {
  const apiKey = DZapClient.getInstance().apiKey || apiKeyEnv;
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
  const apiKey = DZapClient.getInstance().apiKey || apiKeyEnv;
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
