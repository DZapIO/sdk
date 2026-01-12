import { CancelToken } from 'axios';
import { TradeApiClient, ZapApiClient } from '../axios/api';
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

// Trade API methods
export const fetchTradeQuotes = (request: TradeQuotesRequest) => TradeApiClient.fetchTradeQuotes(request);

export const fetchTradeBuildTxnData = (request: TradeBuildTxnRequest) => TradeApiClient.fetchTradeBuildTxnData(request);

export const executeGaslessTxnData = (request: GaslessExecuteTxParams) => TradeApiClient.executeGaslessTxnData(request);

export const broadcastTradeTx = (request: BroadcastTxParams): Promise<BroadcastTxResponse> => TradeApiClient.broadcastTradeTx(request);

export const fetchAllSupportedChains = () => TradeApiClient.fetchAllSupportedChains();

export const fetchAllTokens = (chainId: number, source?: string, account?: string) => TradeApiClient.fetchAllTokens(chainId, source, account);

export const fetchTokenDetails = (
  tokenAddress: string | string[],
  chainId: number,
  account?: string,
  includeBalance?: boolean,
  includePrice?: boolean,
) => TradeApiClient.fetchTokenDetails(tokenAddress, chainId, account, includeBalance, includePrice);

export const fetchTokenPrice = (tokenAddresses: string[], chainId: number) => TradeApiClient.fetchTokenPrice(tokenAddresses, chainId);

export const fetchStatus = ({ txHash, txIds, chainId }: { txHash?: string; txIds?: string; chainId?: number }) =>
  TradeApiClient.fetchStatus({ txHash, txIds, chainId });

export const fetchCalculatedPoints = (request: CalculatePointsRequest) => TradeApiClient.fetchCalculatedPoints(request);

export const fetchBalances = (chainId: number, account: string) => TradeApiClient.fetchBalances(chainId, account);

// Zap API methods
export const broadcastZapTx = (request: BroadcastTxParams): Promise<BroadcastZapTxResponse> => ZapApiClient.broadcastZapTx(request);

export const fetchZapBuildTxnData = (request: ZapBuildTxnRequest, cancelToken?: CancelToken) =>
  ZapApiClient.fetchZapBuildTxnData(request, cancelToken);

export const fetchZapQuote = (request: ZapQuoteRequest, cancelToken?: CancelToken) => ZapApiClient.fetchZapQuote(request, cancelToken);

export const fetchZapTxnStatus = (request: ZapStatusRequest) => ZapApiClient.fetchZapTxnStatus(request);

export const fetchZapPositions = (request: ZapPositionsRequest) => ZapApiClient.fetchZapPositions(request);

export const fetchZapPools = (request: ZapPoolsRequest) => ZapApiClient.fetchZapPools(request);

export const fetchZapPoolDetails = (request: ZapPoolDetailsRequest) => ZapApiClient.fetchZapPoolDetails(request);

export const fetchZapChains = () => ZapApiClient.fetchZapChains();

export const fetchZapProviders = () => ZapApiClient.fetchZapProviders();
