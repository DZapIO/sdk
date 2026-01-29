import type { AxiosInstance } from 'axios';

import { config } from '../config';
import { GET, POST } from '../constants/httpMethods';
import type {
  BroadcastTxParams,
  BroadcastTxResponse,
  CalculatePointsRequest,
  GaslessExecuteTxParams,
  TradeBuildTxnRequest,
  TradeQuotesRequest,
} from '../types';
import { ApiClient } from './base';

export class TradeApiClient extends ApiClient {
  private static tradeInstance: AxiosInstance;

  private static readonly endpoints = {
    swap: {
      quote: 'swap/quote',
      buildTx: 'swap/buildTx',
    },
    bridge: {
      quote: 'bridge/quote',
      buildTx: 'bridge/buildTx',
    },
    quotes: 'quotes',
    buildTx: 'buildTx',
    gasless: {
      executeTx: 'gasless/executeTx',
    },
    broadcast: 'broadcast',
    chains: 'chains',
    token: {
      tokens: 'token/tokens',
      details: 'token/details',
      price: 'token/price',
      balanceOf: 'token/balance-of',
    },
    status: 'status',
    providers: 'config/providers',
    history: 'user/history',
    user: {
      calculatePoints: 'user/calculatePoints',
    },
  } as const;

  private static getBaseUrl(): string {
    return `${config.tradeApi.url}/${config.tradeApi.version}`;
  }

  public static getInstance(): AxiosInstance {
    if (!this.tradeInstance) {
      this.tradeInstance = this.getAxiosInstance(this.getBaseUrl());
    }
    return this.tradeInstance;
  }

  protected static getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { 'x-api-key': config.apiKey } : {}),
    };
  }

  public static fetchTradeQuotes(request: TradeQuotesRequest) {
    return this.invoke({
      endpoint: this.endpoints.quotes,
      data: request,
      method: POST,
      shouldRetry: true,
    });
  }

  public static fetchTradeBuildTxnData(request: TradeBuildTxnRequest) {
    return this.invoke({
      endpoint: this.endpoints.buildTx,
      data: request,
      method: POST,
    });
  }

  public static executeGaslessTxnData(request: GaslessExecuteTxParams) {
    return this.invoke({
      endpoint: this.endpoints.gasless.executeTx,
      data: request,
      method: POST,
    });
  }

  public static broadcastTradeTx(request: BroadcastTxParams): Promise<BroadcastTxResponse> {
    return this.invoke({
      endpoint: this.endpoints.broadcast,
      data: request,
      method: POST,
    });
  }

  public static fetchAllSupportedChains() {
    return this.invoke({
      endpoint: this.endpoints.chains,
      data: {},
      method: GET,
      shouldRetry: true,
    });
  }

  public static fetchAllTokens(chainId: number, source?: string, account?: string) {
    return this.invoke({
      endpoint: this.endpoints.token.tokens,
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
    return this.invoke({
      endpoint: this.endpoints.token.details,
      data,
      method: GET,
    });
  }

  public static fetchTokenPrice(tokenAddresses: string[], chainId: number) {
    return this.invoke({
      endpoint: this.endpoints.token.price,
      data: { tokenAddresses, chainId },
      method: GET,
    });
  }

  public static fetchStatus({ txHash, txIds, chainId }: { txHash?: string; txIds?: string; chainId?: number }) {
    return this.invoke({
      endpoint: this.endpoints.status,
      data: {
        txHash,
        txIds,
        chainId,
      },
      method: GET,
    });
  }

  public static fetchCalculatedPoints(request: CalculatePointsRequest) {
    return this.invoke({
      endpoint: this.endpoints.user.calculatePoints,
      data: request,
      method: POST,
    });
  }

  public static fetchBalances(chainId: number, account: string) {
    return this.invoke({
      endpoint: this.endpoints.token.balanceOf,
      data: { chainId, account },
      method: GET,
    });
  }

  public static fetchProviders(service?: string) {
    return this.invoke({
      endpoint: this.endpoints.providers,
      data: service ? { service } : {},
      method: GET,
    });
  }

  public static fetchTransactionHistory(params: {
    offset?: number;
    limit?: number;
    account: string;
    service?: string;
    chainId?: number;
    status?: string;
    chainType?: string;
    page?: number;
    fetchAllTxs?: boolean;
  }) {
    return this.invoke({
      endpoint: this.endpoints.history,
      data: params,
      method: GET,
    });
  }
}
