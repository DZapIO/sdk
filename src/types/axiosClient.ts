import { AxiosRequestConfig, CancelToken } from 'axios';

export type ExtendedAxiosRequestConfig = {
  shouldRetry?: boolean;
  retryCount?: number;
  cancelToken?: CancelToken;
} & AxiosRequestConfig;
