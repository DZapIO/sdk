import { CancelToken } from 'axios';
import { GET, POST } from 'src/constants/httpMethods';
import {
  BUILD_TX_URL,
  CALCULATE_POINTS_URL,
  GASLESS_EXECUTE_TX_URL,
  GET_ALL_CHAINS_URL,
  GET_ALL_TOKENS_URL,
  GET_STATUS,
  GET_TOKEN_DETAILS_URL,
  GET_TOKEN_PRICE,
  QUOTES_URL,
} from 'src/constants/urlConstants';
import { ZapBuildTxnRequest, ZapQuoteRequest, ZapStatusRequest } from 'src/types/zap';
import { invoke, invokeZap } from 'src/utils/axios';
import { ZAP_BUILD_TX_URL, ZAP_QUOTE_URL, ZAP_TXN_STATUS_URL } from 'src/zap/constants/urls';
import { CalculatePointsRequest, HexString, TradeBuildTxnRequest, TradeQuotesRequest } from '../types';

export const fetchTradeQuotes = (request: TradeQuotesRequest) =>
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

export const executeGaslessTxnData = (request: { chainId: number; txId: HexString; batchPermitData: HexString }) =>
  invoke({
    endpoint: GASLESS_EXECUTE_TX_URL,
    data: request,
    method: POST,
  });

export const fetchZapBuildTxnData = (request: ZapBuildTxnRequest, cancelToken?: CancelToken) =>
  invokeZap({
    endpoint: ZAP_BUILD_TX_URL,
    data: request,
    method: POST,
    cancelToken,
  });

export const fetchZapQuote = (request: ZapQuoteRequest, cancelToken?: CancelToken) =>
  invokeZap({
    endpoint: ZAP_QUOTE_URL,
    data: request,
    method: POST,
    cancelToken,
  });

export const fetchZapTxnStatus = (request: ZapStatusRequest) =>
  invokeZap({
    endpoint: ZAP_TXN_STATUS_URL,
    data: request,
    method: GET,
  });

export const fetchAllSupportedChains = () =>
  invoke({
    endpoint: GET_ALL_CHAINS_URL,
    data: {},
    method: GET,
    shouldRetry: true,
  });

export const fetchAllTokens = (chainId: number, source?: string, account?: string) =>
  invoke({
    endpoint: GET_ALL_TOKENS_URL,
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
    endpoint: GET_TOKEN_DETAILS_URL,
    data,
    method: GET,
  });
};

export const fetchTokenPrice = (tokenAddresses: string[], chainId: number) =>
  invoke({
    endpoint: GET_TOKEN_PRICE,
    data: { tokenAddresses, chainId },
    method: GET,
  });

export const fetchStatus = ({ txHash, txIds, chainId }: { txHash?: string; txIds?: string; chainId?: number }) =>
  invoke({
    endpoint: GET_STATUS,
    data: {
      txHash,
      txIds,
      chainId,
    },
    method: GET,
  });

export const fetchCalculatedPoints = (request: CalculatePointsRequest) =>
  invoke({
    endpoint: CALCULATE_POINTS_URL,
    data: request,
    method: POST,
  });
