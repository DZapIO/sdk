import { CancelToken } from 'axios';

import { GET, POST } from '../constants/httpMethods';
import {
  BROADCAST_TX,
  BUILD_TX_URL,
  CALCULATE_POINTS_URL,
  GASLESS_EXECUTE_TX_URL,
  GET_ALL_CHAINS_URL,
  GET_ALL_TOKENS_URL,
  GET_BALANCES,
  GET_MULTI_STATUS,
  GET_STATUS,
  GET_TOKEN_DETAILS_URL,
  GET_TOKEN_PRICE,
  QUOTES_URL,
} from '../constants/urlConstants';
import {
  BalancesResponse,
  BroadcastTxParams,
  BroadcastTxResponse,
  CalculatePointsRequest,
  GaslessExecuteTxParams,
  SupportedChainsResponse,
  TokenInfo,
  TokenPriceResponse,
  TokenResponse,
  TradeBuildTxnRequest,
  TradeQuotesRequest,
  TradeQuotesResponse,
  TradeStatusResponse,
} from '../types';
import {
  ZapApiResponse,
  ZapBundleRequest,
  ZapBuildTxnRequest,
  ZapChains,
  ZapPoolDetails,
  ZapPoolDetailsRequest,
  ZapPoolsRequest,
  ZapPoolsResponse,
  ZapPositionsRequest,
  ZapPositionsResponse,
  ZapProviders,
  ZapQuoteRequest,
  ZapStatusRequest,
  ZapStatusResponse,
} from '../types/zap';
import { BroadcastZapTxResponse } from '../types/zap/broadcast';
import { invoke, invokeZap } from '../utils/axios';
import { ZAP_ENDPOINTS } from '../zap/constants/urls';

export const fetchTradeQuotes = (request: TradeQuotesRequest): Promise<TradeQuotesResponse> =>
  invoke({
    endpoint: QUOTES_URL,
    data: request,
    method: POST,
    shouldRetry: true,
  });

export const fetchTradeBuildTxnData = (request: TradeBuildTxnRequest) =>
  invoke({
    endpoint: BUILD_TX_URL,
    data: request,
    method: POST,
  });

export const executeGaslessTxnData = (request: GaslessExecuteTxParams) =>
  invoke({
    endpoint: GASLESS_EXECUTE_TX_URL,
    data: request,
    method: POST,
  });

export const broadcastTradeTx = (request: BroadcastTxParams): Promise<BroadcastTxResponse> =>
  invoke({
    endpoint: BROADCAST_TX,
    data: request,
    method: POST,
  });

export const broadcastZapTx = (request: BroadcastTxParams): Promise<BroadcastZapTxResponse> =>
  invokeZap({
    endpoint: ZAP_ENDPOINTS.broadcast,
    data: request,
    method: POST,
  });

export const fetchZapBuildTxnData = (request: ZapBuildTxnRequest, cancelToken?: CancelToken) =>
  invokeZap({
    endpoint: ZAP_ENDPOINTS.buildTx,
    data: request,
    method: POST,
    cancelToken,
  });

export const fetchZapQuote = (request: ZapQuoteRequest, cancelToken?: CancelToken) =>
  invokeZap({
    endpoint: ZAP_ENDPOINTS.quote,
    data: request,
    method: POST,
    cancelToken,
  });

export const fetchZapBundleQuote = (request: ZapBundleRequest, cancelToken?: CancelToken) =>
  invokeZap({
    endpoint: ZAP_ENDPOINTS.bundle.quote,
    data: request,
    method: POST,
    cancelToken,
  });

export const fetchZapBundleBuildTx = (request: ZapBundleRequest, cancelToken?: CancelToken) =>
  invokeZap({
    endpoint: ZAP_ENDPOINTS.bundle.buildTx,
    data: request,
    method: POST,
    cancelToken,
  });

export const fetchZapTxnStatus = (request: ZapStatusRequest): Promise<ZapApiResponse<ZapStatusResponse>> =>
  invokeZap({
    endpoint: ZAP_ENDPOINTS.status,
    data: request,
    method: GET,
  });

export const fetchZapPositions = (request: ZapPositionsRequest): Promise<ZapApiResponse<ZapPositionsResponse>> =>
  invokeZap({
    endpoint: ZAP_ENDPOINTS.positions,
    data: request,
    method: GET,
  });

export const fetchZapPools = (request: ZapPoolsRequest): Promise<ZapApiResponse<ZapPoolsResponse>> =>
  invokeZap({
    endpoint: ZAP_ENDPOINTS.pools,
    data: request,
    method: GET,
  });

export const fetchZapPoolDetails = (request: ZapPoolDetailsRequest): Promise<ZapApiResponse<ZapPoolDetails>> =>
  invokeZap({
    endpoint: ZAP_ENDPOINTS.poolDetails,
    data: request,
    method: GET,
  });

export const fetchZapChains = (): Promise<ZapApiResponse<ZapChains>> =>
  invokeZap({
    endpoint: ZAP_ENDPOINTS.config.chains,
    method: GET,
  });

export const fetchZapProviders = (): Promise<ZapApiResponse<ZapProviders>> =>
  invokeZap({
    endpoint: ZAP_ENDPOINTS.config.providers,
    method: GET,
  });

export const fetchAllSupportedChains = (): Promise<SupportedChainsResponse> =>
  invoke({
    endpoint: GET_ALL_CHAINS_URL,
    data: {},
    method: GET,
    shouldRetry: true,
  });

export const fetchAllTokens = (chainId: number, source?: string, account?: string): Promise<TokenResponse> =>
  invoke({
    endpoint: GET_ALL_TOKENS_URL,
    data: { chainId, source, account },
    method: GET,
    shouldRetry: true,
  });

export function fetchTokenDetails(
  tokenAddress: string,
  chainId: number,
  account?: string,
  includeBalance?: boolean,
  includePrice?: boolean,
): Promise<TokenInfo>;
export function fetchTokenDetails(
  tokenAddress: string[],
  chainId: number,
  account?: string,
  includeBalance?: boolean,
  includePrice?: boolean,
): Promise<TokenResponse>;
export function fetchTokenDetails(
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
  return invoke({
    endpoint: GET_TOKEN_DETAILS_URL,
    data,
    method: GET,
  });
}

export const fetchTokenPrice = (tokenAddresses: string, chainId: number): Promise<TokenPriceResponse> =>
  invoke({
    endpoint: GET_TOKEN_PRICE,
    data: { tokenAddresses, chainId },
    method: GET,
  });

export const fetchStatus = (params: { txHash: string; chainId: number } | { txId: string; chainId: number }): Promise<TradeStatusResponse> =>
  invoke({
    endpoint: GET_STATUS,
    data: params,
    method: GET,
  });

export const fetchMultiTxStatus = (
  params: { txHashes: string; chainIds: string } | { txIds: string; chainIds: string },
): Promise<TradeStatusResponse[]> =>
  invoke({
    endpoint: GET_MULTI_STATUS,
    data: params,
    method: GET,
  });

export const fetchCalculatedPoints = (request: CalculatePointsRequest) =>
  invoke({
    endpoint: CALCULATE_POINTS_URL,
    data: request,
    method: POST,
  });

export const fetchBalances = (chainId: number, account: string): Promise<BalancesResponse> => {
  return invoke({
    endpoint: GET_BALANCES,
    data: { chainId, account },
    method: GET,
  });
};
