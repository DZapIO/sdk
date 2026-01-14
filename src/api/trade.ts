import { AxiosInstance } from 'axios';
import { BaseApiClient } from './base';
import { Config } from '../config';
import { GET, POST } from '../constants/httpMethods';
import { TRADE_ENDPOINTS } from '../constants/api/endpoints';
import {
  BroadcastTxParams,
  BroadcastTxResponse,
  CalculatePointsRequest,
  GaslessExecuteTxParams,
  TradeBuildTxnRequest,
  TradeQuotesRequest,
} from '../types';

export class TradeApiClient extends BaseApiClient {
  private static tradeInstance: AxiosInstance;

  private static getBaseUrl(): string {
    const config = Config.getInstance();
    return `${config.tradeApi.url}/${config.tradeApi.version}`;
  }

  public static getInstance(): AxiosInstance {
    if (!TradeApiClient.tradeInstance) {
      TradeApiClient.tradeInstance = this.getAxiosInstance(TradeApiClient.getBaseUrl());
    }
    return TradeApiClient.tradeInstance;
  }

  protected static getHeaders(): Record<string, string> {
    const config = Config.getInstance();
    return {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { 'x-api-key': config.apiKey } : {}),
    };
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
