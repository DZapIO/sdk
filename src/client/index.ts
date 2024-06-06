import Axios, { CancelTokenSource } from 'axios';
import { Signer } from 'ethers';
import ContractHandler from 'src/contractHandler';
import {
  BridgeParamsRequest,
  BridgeParamsResponse,
  BridgeQuoteRequest,
  BridgeQuoteResponse,
  ChainData,
  SwapParamsRequest,
  SwapQuoteRequest,
  ValidAbis,
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
import { TransactionReceipt, WalletClient } from 'viem';
import { handleDecodeTrxData } from 'src/utils';

class DzapClient {
  private static instance: DzapClient;
  private cancelTokenSource: CancelTokenSource | null = null;
  private contractHandler: ContractHandler;

  private constructor() {
    this.contractHandler = ContractHandler.getInstance();
  }

  // Static method to control the access to the singleton instance.
  public static getInstance(): DzapClient {
    if (!DzapClient.instance) {
      DzapClient.instance = new DzapClient();
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
    signer,
  }: {
    chainId: number;
    rpcProvider: string;
    request: SwapParamsRequest;
    signer: Signer | WalletClient;
  }) {
    return await this.contractHandler.handleSwap({ chainId, rpcProvider, request, signer });
  }

  public async bridge({
    chainId,
    rpcProvider,
    request,
    signer,
  }: {
    chainId: number;
    rpcProvider: string;
    request: BridgeParamsRequest[];
    signer: Signer | WalletClient;
  }) {
    return await this.contractHandler.handleBridge({ chainId, rpcProvider, request, signer });
  }

  public decodeTrxData({ data, abiName }: { data: TransactionReceipt; abiName: ValidAbis }) {
    return handleDecodeTrxData(data, abiName);
  }
}

export default DzapClient;
