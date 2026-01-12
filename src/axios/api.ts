import AxiosClient from '.';
import { Config } from '../config';
import { AxiosInstance, CancelToken, Method } from 'axios';
import { GET, POST } from '../constants/httpMethods';
import { ExtendedAxiosRequestConfig } from '../types/axiosClient';
import { TRADE_ENDPOINTS, ZAP_ENDPOINTS } from '../constants/api/endpoints';
import {
  BroadcastTxParams,
  BroadcastTxResponse,
  CalculatePointsRequest,
  GaslessExecuteTxParams,
  TradeBuildTxnRequest,
  TradeQuotesRequest,
} from '../types';
import { ZapBuildTxnRequest, ZapPoolDetailsRequest, ZapPoolsRequest, ZapPositionsRequest, ZapQuoteRequest, ZapStatusRequest } from '../types/zap';
import { BroadcastZapTxResponse } from '../types/zap/broadcast';

export class TradeApiClient {
  private static instance: AxiosInstance;

  private static getBaseUrl(): string {
    const config = Config.getInstance();
    return `${config.baseApiUrl}/${config.versionPostfix}`;
  }

  public static getInstance(): AxiosInstance {
    if (!TradeApiClient.instance) {
      TradeApiClient.instance = AxiosClient.getInstance(TradeApiClient.getBaseUrl());
    }
    return TradeApiClient.instance;
  }

  public static async invoke({
    endpoint,
    data,
    method = POST,
    cancelToken,
    shouldRetry = false,
  }: {
    endpoint: string;
    data?: any;
    method?: Method;
    cancelToken?: CancelToken;
    shouldRetry?: boolean;
  }) {
    const config = Config.getInstance();
    const axiosConfig: ExtendedAxiosRequestConfig = {
      method,
      url: endpoint,
      data: method === GET ? undefined : data,
      params: method === GET ? data : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { 'x-api-key': config.apiKey } : {}),
      },
      cancelToken,
      shouldRetry,
    };
    return TradeApiClient.getInstance()(axiosConfig)
      .then((res: any) => res.data)
      .catch((error: any) => {
        return Promise.reject(error);
      });
  }

  public static fetchTradeQuotes(request: TradeQuotesRequest) {
    return TradeApiClient.invoke({
      endpoint: TRADE_ENDPOINTS.quotes,
      data: request,
      method: POST,
      shouldRetry: true,
    });
  }

  public static fetchTradeBuildTxnData(request: TradeBuildTxnRequest) {
    return TradeApiClient.invoke({
      endpoint: TRADE_ENDPOINTS.buildTx,
      data: request,
      method: POST,
    });
  }

  public static executeGaslessTxnData(request: GaslessExecuteTxParams) {
    return TradeApiClient.invoke({
      endpoint: TRADE_ENDPOINTS.gasless.executeTx,
      data: request,
      method: POST,
    });
  }

  public static broadcastTradeTx(request: BroadcastTxParams): Promise<BroadcastTxResponse> {
    return TradeApiClient.invoke({
      endpoint: TRADE_ENDPOINTS.broadcast,
      data: request,
      method: POST,
    });
  }

  public static fetchAllSupportedChains() {
    return TradeApiClient.invoke({
      endpoint: TRADE_ENDPOINTS.chains,
      data: {},
      method: GET,
      shouldRetry: true,
    });
  }

  public static fetchAllTokens(chainId: number, source?: string, account?: string) {
    return TradeApiClient.invoke({
      endpoint: TRADE_ENDPOINTS.token.tokens,
      data: { chainId, source, account },
      method: GET,
      shouldRetry: true,
    });
  }

  public static fetchTokenDetails(
    tokenAddress: string | string[],
    chainId: number,
    account?: string,
    includeBalance?: boolean,
    includePrice?: boolean,
  ) {
    const data = {
      tokenAddress: Array.isArray(tokenAddress) ? undefined : tokenAddress,
      tokenAddresses: Array.isArray(tokenAddress) ? tokenAddress.join(',') : undefined,
      chainId,
      account,
      includeBalance,
      includePrice,
    };
    return TradeApiClient.invoke({
      endpoint: TRADE_ENDPOINTS.token.details,
      data,
      method: GET,
    });
  }

  public static fetchTokenPrice(tokenAddresses: string[], chainId: number) {
    return TradeApiClient.invoke({
      endpoint: TRADE_ENDPOINTS.token.price,
      data: { tokenAddresses, chainId },
      method: GET,
    });
  }

  public static fetchStatus({ txHash, txIds, chainId }: { txHash?: string; txIds?: string; chainId?: number }) {
    return TradeApiClient.invoke({
      endpoint: TRADE_ENDPOINTS.status,
      data: {
        txHash,
        txIds,
        chainId,
      },
      method: GET,
    });
  }

  public static fetchCalculatedPoints(request: CalculatePointsRequest) {
    return TradeApiClient.invoke({
      endpoint: TRADE_ENDPOINTS.user.calculatePoints,
      data: request,
      method: POST,
    });
  }

  public static fetchBalances(chainId: number, account: string) {
    return TradeApiClient.invoke({
      endpoint: TRADE_ENDPOINTS.token.balanceOf,
      data: { chainId, account },
      method: GET,
    });
  }
}

export class ZapApiClient {
  private static instance: AxiosInstance;

  private static getBaseUrl(): string {
    const config = Config.getInstance();
    return `${config.zapApiUrl}/${config.versionPostfix}`;
  }

  public static getInstance(): AxiosInstance {
    if (!ZapApiClient.instance) {
      ZapApiClient.instance = AxiosClient.getInstance(ZapApiClient.getBaseUrl());
    }
    return ZapApiClient.instance;
  }

  public static async invoke({
    endpoint,
    data,
    method = POST,
    cancelToken,
    shouldRetry = false,
  }: {
    endpoint: string;
    data?: any;
    method?: Method;
    cancelToken?: CancelToken;
    shouldRetry?: boolean;
  }) {
    const config = Config.getInstance();
    const axiosConfig: ExtendedAxiosRequestConfig = {
      method,
      url: endpoint,
      data: method === GET ? undefined : data,
      params: method === GET ? data : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { 'x-api-key': config.apiKey } : {}),
      },
      cancelToken,
      shouldRetry,
    };
    return ZapApiClient.getInstance()(axiosConfig)
      .then((res: any) => res.data)
      .catch((error: any) => {
        return Promise.reject(error);
      });
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
