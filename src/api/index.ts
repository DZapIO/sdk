import { GET, POST } from 'src/constants/httpMethods';
import {
  BUILD_TX_URL,
  CALCULATE_POINTS_URL,
  GET_ALL_CHAINS_URL,
  GET_ALL_TOKENS_URL,
  GET_STATUS,
  GET_TOKEN_DETAILS_URL,
  GET_TOKEN_PRICE,
  QUOTES_URL,
} from 'src/constants/urlConstants';
import { invoke } from 'src/utils/axios';
import { BuildTxRequest, CalculatePointsRequest, QuotesRequest } from '../types';

export const fetchQuotes = (request: QuotesRequest) =>
  invoke({
    endpoint: QUOTES_URL,
    data: request,
    method: POST,
    shouldRetry: true,
  });

export const buildTransaction = (request: BuildTxRequest) =>
  invoke({
    endpoint: BUILD_TX_URL,
    data: request,
    method: POST,
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

export const fetchTokenDetails = (tokenAddress: string, chainId: number, account?: string, includeBalance?: boolean, includePrice?: boolean) =>
  invoke({
    endpoint: GET_TOKEN_DETAILS_URL,
    data: { tokenAddress, chainId, account, includeBalance, includePrice },
    method: GET,
  });

export const fetchTokenPrice = (tokenAddresses: string[], chainId: number) =>
  invoke({
    endpoint: GET_TOKEN_PRICE,
    data: { tokenAddresses, chainId },
    method: GET,
  });

export const fetchStatus = ({ txHash, txIds, chainId }: { txHash?: string; txIds?: string; chainId?: string }) =>
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
