import { AxiosInstance, CancelToken } from 'axios';
import { ApiClient } from './base';
import { config } from '../config';
import { GET, POST } from '../constants/httpMethods';
import { BroadcastTxParams } from '../types';
import { ZapBuildTxnRequest, ZapPoolDetailsRequest, ZapPoolsRequest, ZapPositionsRequest, ZapQuoteRequest, ZapStatusRequest } from '../types/zap';
import { BroadcastZapTxResponse } from '../types/zap/broadcast';

export class ZapApiClient extends ApiClient {
  private static zapInstance: AxiosInstance;

  private static readonly endpoints = {
    status: 'status',
    config: {
      chains: 'config/chains',
      providers: 'config/providers',
    },
    pools: 'pools',
    poolDetails: 'pool/details',
    positions: 'user/positions',
    buildTx: 'buildTx',
    quote: 'quote',
    broadcast: 'broadcast',
  } as const;

  private static getBaseUrl(): string {
    return `${config.zapApi.url}/${config.zapApi.version}`;
  }

  public static getInstance(): AxiosInstance {
    if (!this.zapInstance) {
      this.zapInstance = this.getAxiosInstance(this.getBaseUrl());
    }
    return this.zapInstance;
  }

  protected static getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { 'x-api-key': config.apiKey } : {}),
    };
  }

  public static broadcastZapTx(request: BroadcastTxParams): Promise<BroadcastZapTxResponse> {
    return this.invoke({
      endpoint: this.endpoints.broadcast,
      data: request,
      method: POST,
    });
  }

  public static fetchZapBuildTxnData(request: ZapBuildTxnRequest, cancelToken?: CancelToken) {
    return this.invoke({
      endpoint: this.endpoints.buildTx,
      data: request,
      method: POST,
      cancelToken,
    });
  }

  public static fetchZapQuote(request: ZapQuoteRequest, cancelToken?: CancelToken) {
    return this.invoke({
      endpoint: this.endpoints.quote,
      data: request,
      method: POST,
      cancelToken,
    });
  }

  public static fetchZapTxnStatus(request: ZapStatusRequest) {
    return this.invoke({
      endpoint: this.endpoints.status,
      data: request,
      method: GET,
    });
  }

  public static fetchZapPositions(request: ZapPositionsRequest) {
    return this.invoke({
      endpoint: this.endpoints.positions,
      data: request,
      method: GET,
    });
  }

  public static fetchZapPools(request: ZapPoolsRequest) {
    return this.invoke({
      endpoint: this.endpoints.pools,
      data: request,
      method: GET,
    });
  }

  public static fetchZapPoolDetails(request: ZapPoolDetailsRequest) {
    return this.invoke({
      endpoint: this.endpoints.poolDetails,
      data: request,
      method: GET,
    });
  }

  public static fetchZapChains() {
    return this.invoke({
      endpoint: this.endpoints.config.chains,
      method: GET,
    });
  }

  public static fetchZapProviders() {
    return this.invoke({
      endpoint: this.endpoints.config.providers,
      method: GET,
    });
  }
}
