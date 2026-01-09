import { AxiosInstance, CancelToken, Method } from 'axios';
import { tradeApiClient, zapApiClient } from '../axios/api';
import { GET, POST } from '../constants/httpMethods';
import { ExtendedAxiosRequestConfig } from '../types/axiosClient';
import { Config } from '../config';

type Invoke = {
  endpoint: string;
  data?: any;
  method?: Method;
  cancelToken?: CancelToken;
  shouldRetry?: boolean;
};

const invoke = async ({ endpoint, data, method = POST, cancelToken, shouldRetry = false, baseClient }: Invoke & { baseClient: AxiosInstance }) => {
  const config = Config.getInstance();
  const axiosConfig: ExtendedAxiosRequestConfig = {
    method,
    url: endpoint,
    data: method === GET ? undefined : data,
    params: method === GET ? data : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { 'x-api-key': config.apiKey } : {}),
    },
    cancelToken,
    shouldRetry,
  };
  return baseClient(axiosConfig)
    .then((res: any) => res.data)
    .catch((error: any) => {
      return Promise.reject(error);
    });
};

export const invokeTrade = async (params: Invoke) => {
  return invoke({ ...params, baseClient: tradeApiClient });
};

export const invokeZap = async (params: Invoke) => {
  return invoke({ ...params, baseClient: zapApiClient });
};
