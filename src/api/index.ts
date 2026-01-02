import { CancelToken } from 'axios';

import { GET, POST } from '../constants/httpMethods';
import {
  BroadcastTxParams,
  BroadcastTxResponse,
  CalculatePointsRequest,
  GaslessExecuteTxParams,
  TradeBuildTxnRequest,
  TradeQuotesRequest,
} from '../types';
import { ZapBuildTxnRequest, ZapPoolDetailsRequest, ZapPoolsRequest, ZapPositionsRequest, ZapQuoteRequest, ZapStatusRequest } from '../types/zap';
import { invoke, invokeZap } from '../utils/axios';
import { ZAP_ENDPOINTS, TRADE_ENDPOINTS } from '../constants/api/endpoints';
import { BroadcastZapTxResponse } from '../types/zap/broadcast';

export const fetchTradeQuotes = (request: TradeQuotesRequest) =>
  invoke({
    endpoint: TRADE_ENDPOINTS.quotes,
    data: request,
    method: POST,
    shouldRetry: true,
  });

export const fetchTradeBuildTxnData = (request: TradeBuildTxnRequest) =>
  invoke({
    endpoint: TRADE_ENDPOINTS.buildTx,
    data: request,
    method: POST,
  });

export const executeGaslessTxnData = (request: GaslessExecuteTxParams) =>
  invoke({
    endpoint: TRADE_ENDPOINTS.gasless.executeTx,
    data: request,
    method: POST,
  });

export const broadcastTradeTx = (request: BroadcastTxParams): Promise<BroadcastTxResponse> =>
  invoke({
    endpoint: TRADE_ENDPOINTS.broadcast,
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

export const fetchZapTxnStatus = (request: ZapStatusRequest) =>
  invokeZap({
    endpoint: ZAP_ENDPOINTS.status,
    data: request,
    method: GET,
  });

export const fetchZapPositions = (request: ZapPositionsRequest) =>
  invokeZap({
    endpoint: ZAP_ENDPOINTS.positions,
    data: request,
    method: GET,
  });

export const fetchZapPools = (request: ZapPoolsRequest) =>
  invokeZap({
    endpoint: ZAP_ENDPOINTS.pools,
    data: request,
    method: GET,
  });

export const fetchZapPoolDetails = (request: ZapPoolDetailsRequest) =>
  invokeZap({
    endpoint: ZAP_ENDPOINTS.poolDetails,
    data: request,
    method: GET,
  });

export const fetchZapChains = () =>
  invokeZap({
    endpoint: ZAP_ENDPOINTS.config.chains,
    method: GET,
  });

export const fetchZapProviders = () =>
  invokeZap({
    endpoint: ZAP_ENDPOINTS.config.providers,
    method: GET,
  });

export const fetchAllSupportedChains = () =>
  invoke({
    endpoint: TRADE_ENDPOINTS.chains,
    data: {},
    method: GET,
    shouldRetry: true,
  });

export const fetchAllTokens = (chainId: number, source?: string, account?: string) =>
  invoke({
    endpoint: TRADE_ENDPOINTS.token.tokens,
    data: { chainId, source, account },
    method: GET,
    shouldRetry: true,
  });

export const fetchTokenDetails = (
  tokenAddress: string | string[],
  chainId: number,
  account?: string,
  includeBalance?: boolean,
  includePrice?: boolean,
) => {
  const data = {
    tokenAddress: Array.isArray(tokenAddress) ? undefined : tokenAddress,
    tokenAddresses: Array.isArray(tokenAddress) ? tokenAddress.join(',') : undefined,
    chainId,
    account,
    includeBalance,
    includePrice,
  };
  return invoke({
    endpoint: TRADE_ENDPOINTS.token.details,
    data,
    method: GET,
  });
};

export const fetchTokenPrice = (tokenAddresses: string[], chainId: number) =>
  invoke({
    endpoint: TRADE_ENDPOINTS.token.price,
    data: { tokenAddresses, chainId },
    method: GET,
  });

export const fetchStatus = ({ txHash, txIds, chainId }: { txHash?: string; txIds?: string; chainId?: number }) =>
  invoke({
    endpoint: TRADE_ENDPOINTS.status,
    data: {
      txHash,
      txIds,
      chainId,
    },
    method: GET,
  });

export const fetchCalculatedPoints = (request: CalculatePointsRequest) =>
  invoke({
    endpoint: TRADE_ENDPOINTS.user.calculatePoints,
    data: request,
    method: POST,
  });

export const fetchBalances = (chainId: number, account: string) => {
  return invoke({
    endpoint: TRADE_ENDPOINTS.token.balanceOf,
    data: { chainId, account },
    method: GET,
  });
};
