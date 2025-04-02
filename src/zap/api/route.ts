import { CancelToken } from 'axios';
import { GET, POST } from 'src/constants/httpMethods';
import { invokeZap } from 'src/utils/axios';
import { ZAP_ROUTE_URL, ZAP_TXN_STATUS_URL } from '../constants/urls';
import { ZapRouteRequest, ZapTxnStatusRequest } from '../types';
import { getBaseZapUrl } from 'src/config';

export const fetchZapRoute = (request: ZapRouteRequest, cancelToken: CancelToken) =>
  invokeZap({
    endpoint: `${getBaseZapUrl()}/${ZAP_ROUTE_URL}`,
    data: request,
    method: POST,
    cancelToken,
    shouldRetry: true,
  });

export const fetchZapTxnStatus = (request: ZapTxnStatusRequest) =>
  invokeZap({
    endpoint: `${getBaseZapUrl()}/${ZAP_TXN_STATUS_URL}`,
    data: request,
    method: GET,
  });
