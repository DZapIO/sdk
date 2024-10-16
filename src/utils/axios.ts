import { CancelToken, Method } from 'axios';
import { baseApiClient } from 'src/client/axios/baseClient';
import { GET, POST } from 'src/constants/httpMethods';
import { ExtendedAxiosRequestConfig } from 'src/types/axiosClient';

type Invoke = {
  endpoint: string;
  data?: any;
  method?: Method;
  cancelToken?: CancelToken;
  shouldRetry?: boolean;
};

export const invoke = async ({ endpoint, data, method = POST, cancelToken, shouldRetry = false }: Invoke) => {
  const config: ExtendedAxiosRequestConfig = {
    method,
    url: endpoint,
    data: method === GET ? undefined : data,
    params: method === GET ? data : undefined,
    cancelToken,
    shouldRetry,
  };
  return baseApiClient(config)
    .then((res) => res.data)
    .catch((error) => {
      return Promise.reject(error);
    });
};
