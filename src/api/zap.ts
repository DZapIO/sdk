import type { AxiosInstance, CancelToken, CancelTokenSource } from 'axios';
import Axios from 'axios';

import { config } from '../config';
import { GET, POST } from '../constants/httpMethods';
import type { BroadcastTxParams } from '../types';
import type {
  ZapBuildTxnRequest,
  ZapPoolDetailsRequest,
  ZapPoolsRequest,
  ZapPositionsRequest,
  ZapQuoteRequest,
  ZapStatusRequest,
} from '../types/zap';
import type { BroadcastZapTxResponse } from '../types/zap/broadcast';
import { ApiClient } from './base';

export class ZapApiClient extends ApiClient {
  private static zapInstance: AxiosInstance;
  private static cancelTokenSource: CancelTokenSource | null = null;

  private static readonly endpoints = {
    status: 'status',
    config: {
      chains: 'config/chains',
      providers: 'config/providers',
    },
    pools: 'pools',
    poolDetails: 'pool/details',
    positions: 'user/positions',
    history: 'user/transactions',
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

  /**
   * Returns a cancel token for the current request and cancels any previous in-flight request.
   * Used by quote and buildTx to ensure only the latest request is active.
   */
  private static getCancelToken(): CancelToken {
    if (this.cancelTokenSource) {
      this.cancelTokenSource.cancel('Cancelled due to new request');
    }
    this.cancelTokenSource = Axios.CancelToken.source();
    return this.cancelTokenSource.token;
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

  public static fetchZapBuildTxnData(request: ZapBuildTxnRequest) {
    return this.invoke({
      endpoint: this.endpoints.buildTx,
      data: request,
      method: POST,
      cancelToken: this.getCancelToken(),
    });
  }

  public static fetchZapQuote(request: ZapQuoteRequest) {
    return this.invoke({
      endpoint: this.endpoints.quote,
      data: request,
      method: POST,
      cancelToken: this.getCancelToken(),
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

  public static fetchZapTransactionHistory(
    params: {
      offset: number;
      limit: number;
      account: string;
      chainId?: number;
      status?: string;
      chainType?: string;
      page?: number;
      service?: string;
    },
    signal?: AbortSignal,
  ) {
    return this.invoke({
      endpoint: this.endpoints.history,
      data: params,
      method: GET,
      signal,
    });
  }
}
