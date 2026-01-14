import { AxiosInstance, CancelToken } from 'axios';
import { BaseApiClient } from './base';
import { Config } from '../config';
import { GET, POST } from '../constants/httpMethods';
import { ZAP_ENDPOINTS } from '../constants/api/endpoints';
import { BroadcastTxParams } from '../types';
import { ZapBuildTxnRequest, ZapPoolDetailsRequest, ZapPoolsRequest, ZapPositionsRequest, ZapQuoteRequest, ZapStatusRequest } from '../types/zap';
import { BroadcastZapTxResponse } from '../types/zap/broadcast';

export class ZapApiClient extends BaseApiClient {
  private static zapInstance: AxiosInstance;

  private static getBaseUrl(): string {
    const config = Config.getInstance();
    return `${config.zapApi.url}/${config.zapApi.version}`;
  }

  public static getInstance(): AxiosInstance {
    if (!ZapApiClient.zapInstance) {
      ZapApiClient.zapInstance = this.getAxiosInstance(ZapApiClient.getBaseUrl());
    }
    return ZapApiClient.zapInstance;
  }

  protected static getHeaders(): Record<string, string> {
    const config = Config.getInstance();
    return {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { 'x-api-key': config.apiKey } : {}),
    };
  }

  public static broadcastZapTx(request: BroadcastTxParams): Promise<BroadcastZapTxResponse> {
    return ZapApiClient.invoke({
      endpoint: ZAP_ENDPOINTS.broadcast,
      data: request,
      method: POST,
    });
  }

  public static fetchZapBuildTxnData(request: ZapBuildTxnRequest, cancelToken?: CancelToken) {
    return ZapApiClient.invoke({
      endpoint: ZAP_ENDPOINTS.buildTx,
      data: request,
      method: POST,
      cancelToken,
    });
  }

  public static fetchZapQuote(request: ZapQuoteRequest, cancelToken?: CancelToken) {
    return ZapApiClient.invoke({
      endpoint: ZAP_ENDPOINTS.quote,
      data: request,
      method: POST,
      cancelToken,
    });
  }

  public static fetchZapTxnStatus(request: ZapStatusRequest) {
    return ZapApiClient.invoke({
      endpoint: ZAP_ENDPOINTS.status,
      data: request,
      method: GET,
    });
  }

  public static fetchZapPositions(request: ZapPositionsRequest) {
    return ZapApiClient.invoke({
      endpoint: ZAP_ENDPOINTS.positions,
      data: request,
      method: GET,
    });
  }

  public static fetchZapPools(request: ZapPoolsRequest) {
    return ZapApiClient.invoke({
      endpoint: ZAP_ENDPOINTS.pools,
      data: request,
      method: GET,
    });
  }

  public static fetchZapPoolDetails(request: ZapPoolDetailsRequest) {
    return ZapApiClient.invoke({
      endpoint: ZAP_ENDPOINTS.poolDetails,
      data: request,
      method: GET,
    });
  }

  public static fetchZapChains() {
    return ZapApiClient.invoke({
      endpoint: ZAP_ENDPOINTS.config.chains,
      method: GET,
    });
  }

  public static fetchZapProviders() {
    return ZapApiClient.invoke({
      endpoint: ZAP_ENDPOINTS.config.providers,
      method: GET,
    });
  }
}
