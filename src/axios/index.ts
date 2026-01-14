import type { AxiosInstance } from 'axios';
import axios from 'axios';

import { MAX_RETRY_ATTEMPTS, RETRY_DELAY_MS } from '../constants/api/axios';
import type { ExtendedAxiosRequestConfig } from '../types/axiosClient';

class AxiosClient {
  private static instances: Map<string, AxiosClient> = new Map();
  private axiosInstance: AxiosInstance;

  private constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL,
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config as ExtendedAxiosRequestConfig;

        if (!config) {
          return Promise.reject(error);
        }

        config.retryCount = config.retryCount ?? 0;
        config.shouldRetry = config.shouldRetry ?? false;

        if (config.shouldRetry && config.retryCount < MAX_RETRY_ATTEMPTS) {
          config.retryCount += 1;

          await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
          return this.axiosInstance(config);
        }

        return Promise.reject(error);
      },
    );
  }

  public static getInstance(baseURL: string): AxiosInstance {
    if (!AxiosClient.instances.has(baseURL)) {
      AxiosClient.instances.set(baseURL, new AxiosClient(baseURL));
    }
    return AxiosClient.instances.get(baseURL)!.axiosInstance;
  }
}

export default AxiosClient;
