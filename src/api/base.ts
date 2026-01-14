import type { AxiosInstance, CancelToken, Method } from 'axios';

import AxiosClient from '../axios';
import { GET } from '../constants/httpMethods';
import type { ExtendedAxiosRequestConfig } from '../types/axiosClient';

export class ApiClient {
  protected static instance: AxiosInstance;
  protected static baseUrl: string = '';

  protected static getAxiosInstance(baseUrl: string = ''): AxiosInstance {
    return AxiosClient.getInstance(baseUrl);
  }

  public static getInstance(): AxiosInstance {
    if (!this.instance) {
      this.instance = this.getAxiosInstance(this.baseUrl);
    }
    return this.instance;
  }

  public static async invoke({
    endpoint,
    data,
    method = GET,
    cancelToken,
    shouldRetry = false,
  }: {
    endpoint: string;
    data?: unknown;
    method?: Method;
    cancelToken?: CancelToken;
    shouldRetry?: boolean;
  }) {
    const axiosConfig: ExtendedAxiosRequestConfig = {
      method,
      url: endpoint,
      data: method === GET ? undefined : data,
      params: method === GET ? data : undefined,
      headers: this.getHeaders(),
      cancelToken,
      shouldRetry,
    };
    return this.getInstance()(axiosConfig)
      .then((res) => res.data)
      .catch((error) => {
        return Promise.reject(error);
      });
  }

  protected static getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }
}
