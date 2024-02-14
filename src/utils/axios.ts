import Axios, { CancelToken, Method } from 'axios';
import { baseUrl } from 'src/config';
import { POST } from 'src/constants/httpMethods';

export const invoke = async (endpoint: string, data: any, method?: Method, cancelToken?: CancelToken) => {
  const url = `${baseUrl}${endpoint}`;
  return Axios({
    method: method || POST,
    url,
    data,
    cancelToken,
  })
    .then((res) => res.data)
    .catch((error) => {
      if (Axios.isCancel(error)) {
        return Promise.resolve({});
      }
      return Promise.reject(error);
    });
};
