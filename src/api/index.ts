import {
  BATCH_SWAP_BUILD_TX_URL,
  BATCH_SWAP_QUOTE_URL,
  BRIDGE_BUILD_TX_URL,
  BRIDGE_QUOTE_URL,
  CALCULATE_POINTS_URL,
  GET_ALL_CHAINS_URL,
  GET_ALL_TOKENS_URL,
  GET_TOKEN_DETAILS_URL,
  GET_TOKEN_PRICE,
} from 'src/constants/urlConstants';
import { BridgeParamsRequest, BridgeQuoteRequest, CalculatePointsRequest, SwapParamsRequest, SwapQuoteRequest } from '../types';
import { GET, POST } from 'src/constants/httpMethods';

import { CancelToken } from 'axios';
import { Signer } from 'ethers';
import { invoke } from 'src/utils/axios';

export const fetchQuoteRate = (request: SwapQuoteRequest, cancelToken: CancelToken) => invoke(BATCH_SWAP_QUOTE_URL, request, POST, cancelToken);

export const fetchBridgeQuoteRate = (request: BridgeQuoteRequest, cancelToken: CancelToken) => invoke(BRIDGE_QUOTE_URL, request, POST, cancelToken);

export const buildBridgeTransaction = (request: BridgeParamsRequest) => invoke(BRIDGE_BUILD_TX_URL, request, POST);

export const buildSwapTransaction = (request: SwapParamsRequest) => {
  return invoke(BATCH_SWAP_BUILD_TX_URL, request);
};

export const fetchAllSupportedChains = () => {
  return invoke(GET_ALL_CHAINS_URL, {}, GET);
};

export const fetchAllTokens = (chainId: number, source?: string, account?: string) => {
  return invoke(GET_ALL_TOKENS_URL, { chainId, source, account }, GET);
};

export const fetchTokenDetails = (tokenAddress: string, chainId: number) => {
  return invoke(GET_TOKEN_DETAILS_URL, { tokenAddress, chainId }, GET);
};

export const fetchTokenPrice = (tokenAddresses: string[], chainId: number) => {
  return invoke(GET_TOKEN_PRICE, { tokenAddresses, chainId }, GET);
};

export const fetchCalculatedPoints = (request: CalculatePointsRequest) => {
  return invoke(CALCULATE_POINTS_URL, request, POST);
};

export const swapTokensApi = async ({ request, provider }: { request: SwapParamsRequest; provider: Signer }) => {
  try {
    const { data: paramResponseData } = await buildSwapTransaction(request);
    const {
      transactionRequest: { data, from, to, value, gasLimit },
    } = paramResponseData;

    // Add gasPrice : fast, medium, slow
    return await provider.sendTransaction({
      from,
      to,
      data,
      value,
      gasLimit,
    });
  } catch (err) {
    throw new Error(err);
  }
};
