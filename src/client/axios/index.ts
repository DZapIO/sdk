import type { AxiosInstance } from 'axios';
import axios from 'axios';
import { ExtendedAxiosRequestConfig } from 'src/types/axiosClient';
import { API_REQUEST_TIMEOUT, MAX_RETRY_ATTEMPTS, RETRY_DELAY_MS } from '../../constants/axioslient';

class AxiosClient {
  private static instance: AxiosClient | null = null;
  private axiosInstance: AxiosInstance;

  private constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: API_REQUEST_TIMEOUT,
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config as ExtendedAxiosRequestConfig; // Explicitly type the config

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
    if (!AxiosClient.instance) {
      AxiosClient.instance = new AxiosClient(baseURL);
    }
    return AxiosClient.instance.axiosInstance;
  }
}

export default AxiosClient;
