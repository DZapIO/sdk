import Axios, { CancelTokenSource } from 'axios';
import { Signer } from 'ethers';
import ContractHandler from 'src/contractHandler';
import { ConnectorType } from 'src/enums';
import {
  BridgeParamsRequest,
  BridgeParamsResponse,
  BridgeQuoteRequest,
  BridgeQuoteResponse,
  ChainData,
  SwapParamsRequest,
  SwapQuoteRequest,
} from 'src/types';
import {
  fetchAllSupportedChains,
  fetchAllTokens,
  fetchBridgeParams,
  fetchBridgeQuoteRate,
  fetchQuoteRate,
  fetchSwapParams,
  fetchTokenDetails,
  fetchTokenPrice,
  swapTokensApi,
} from '../api';

class DzapClient {
  private static instance: DzapClient;
  private cancelTokenSource: CancelTokenSource | null = null;
  private contractHandler: ContractHandler;

  private constructor(wcProjectId: string = '') {
    this.contractHandler = ContractHandler.getInstance(wcProjectId);
  }

  // Static method to control the access to the singleton instance.
  public static getInstance(wcProjectId: string = ''): DzapClient {
    if (!DzapClient.instance) {
      DzapClient.instance = new DzapClient(wcProjectId);
    }
    return DzapClient.instance;
  }

  public async getQuoteRate(request: SwapQuoteRequest) {
    if (this.cancelTokenSource) {
      this.cancelTokenSource.cancel('Cancelled due to new request');
    }

    this.cancelTokenSource = Axios.CancelToken.source();
    return await fetchQuoteRate(request, this.cancelTokenSource.token);
  }

  public async getBridgeQuoteRate(request: BridgeQuoteRequest[]): Promise<BridgeQuoteResponse> {
    if (this.cancelTokenSource) {
      this.cancelTokenSource.cancel('Cancelled due to new request');
    }
    this.cancelTokenSource = Axios.CancelToken.source();
    return await fetchBridgeQuoteRate(request, this.cancelTokenSource.token);
  }

  public async getBridgeParams(request: BridgeParamsRequest[]): Promise<BridgeParamsResponse> {
    return await fetchBridgeParams(request);
  }

  public getSwapParams(request: SwapParamsRequest) {
    return fetchSwapParams(request);
  }

  public getAllSupportedChains(): Promise<ChainData> {
    return fetchAllSupportedChains();
  }

  public async getAllTokens(chainId: number, source?: string, account?: string) {
    return await fetchAllTokens(chainId, source, account);
  }

  public async getTokenDetails(tokenAddress: string, chainId: number) {
    return await fetchTokenDetails(tokenAddress, chainId);
  }

  public async getTokenPrice(tokenAddresses: string[], chainId: number): Promise<Record<string, string>> {
    return await fetchTokenPrice(tokenAddresses, chainId);
  }

  public swapTokens = ({ request, provider }: { request: SwapParamsRequest; provider: Signer }) => {
    return swapTokensApi({ request, provider });
  };

  public async swap({
    chainId,
    rpcProvider,
    request,
    connectorType = ConnectorType.injected,
  }: {
    chainId: number;
    rpcProvider: string;
    request: SwapParamsRequest;
    connectorType?: ConnectorType;
  }) {
    return await this.contractHandler.handleSwap({ chainId, rpcProvider, request, connectorType });
  }

  public async bridge({
    chainId,
    rpcProvider,
    request,
    connectorType = ConnectorType.injected,
  }: {
    chainId: number;
    rpcProvider: string;
    request: BridgeParamsRequest[];
    connectorType?: ConnectorType;
  }) {
    return await this.contractHandler.handleBridge({ chainId, rpcProvider, request, connectorType });
  }
}

export default DzapClient;
