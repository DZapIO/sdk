import { CancelToken } from 'axios';
import { GET, POST } from 'src/constants/httpMethods';
import { invokeZap } from 'src/utils/axios';
import { ZAP_BUILD_TX_URL, ZAP_TXN_STATUS_URL, ZAP_QUOTE_URL } from '../constants/urls';
import { ZapBuildTxnRequest, ZapQuoteRequest, ZapTxnStatusRequest } from '../types';
import { getBaseZapUrl } from 'src/config';

export const fetchZapBuildTxnData = (request: ZapBuildTxnRequest, cancelToken: CancelToken) =>
  invokeZap({
    endpoint: `${getBaseZapUrl()}/${ZAP_BUILD_TX_URL}`,
    data: request,
    method: POST,
    cancelToken,
  });

export const fetchZapQuote = (request: ZapQuoteRequest, cancelToken: CancelToken) =>
  invokeZap({
    endpoint: `${getBaseZapUrl()}/${ZAP_QUOTE_URL}`,
    data: request,
    method: POST,
    cancelToken,
  });

export const fetchZapTxnStatus = (request: ZapTxnStatusRequest) =>
  invokeZap({
    endpoint: `${getBaseZapUrl()}/${ZAP_TXN_STATUS_URL}`,
    data: request,
    method: GET,
  });
