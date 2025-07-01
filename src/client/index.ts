import Axios, { CancelTokenSource } from 'axios';
import { Signer, Wallet } from 'ethers';
import { Services } from 'src/constants';
import ContractHandler from 'src/contractHandler';
import PermitHandler from 'src/contractHandler/permitHandler';
import { StatusCodes, TxnStatus } from 'src/enums';
import { PriceService } from 'src/service/price';
import {
  AvailableDZapServices,
  BuildTxRequest,
  BuildTxResponse,
  CalculatePointsRequest,
  Chain,
  ChainData,
  ExecuteTxnData,
  HexString,
  OtherAvailableAbis,
  QuotesRequest,
  QuotesResponse,
  StatusResponse,
} from 'src/types';
import { getDZapAbi, getOtherAbis, handleDecodeTrxData } from 'src/utils';
import { updateTokenListPrices } from 'src/utils/tokens';
import { updateQuotes } from 'src/utils/updateQuotes';
import ZapHandler from 'src/zap';
import { fetchZapBuildTxnData, fetchZapQuote, fetchZapTxnStatus } from 'src/zap/api/route';
import { ZapBuildTxnRequest, ZapBuildTxnResponse, ZapQuoteRequest, ZapQuoteResponse, ZapTxnStatusRequest, ZapTxnStatusResponse } from 'src/zap/types';
import { ZapTransactionStep, ZapTxnDetails } from 'src/zap/types/step';
import { TransactionReceipt, WalletClient } from 'viem';
import {
  buildTransaction,
  fetchAllSupportedChains,
  fetchAllTokens,
  fetchCalculatedPoints,
  fetchQuotes,
  fetchStatus,
  fetchTokenDetails,
} from '../api';

class DzapClient {
  private static instance: DzapClient;
  private cancelTokenSource: CancelTokenSource | null = null;
  private contractHandler: ContractHandler;
  private permitHandler: PermitHandler;
  private zapHandler: ZapHandler;
  private static chainConfig: ChainData | null = null;
  private priceService;
  private constructor() {
    this.contractHandler = ContractHandler.getInstance();
    this.permitHandler = PermitHandler.getInstance();
    this.priceService = new PriceService();
    this.zapHandler = ZapHandler.getInstance();
  }

  // Static method to control the access to the singleton instance.
  public static getInstance(): DzapClient {
    if (!DzapClient.instance) {
      DzapClient.instance = new DzapClient();
    }
    return DzapClient.instance;
  }

  public static async getChainConfig(): Promise<ChainData> {
    if (!DzapClient.chainConfig) {
      const data = await fetchAllSupportedChains();
      const chains: ChainData = {};
      data.forEach((chain: Chain) => {
        if (!chains[chain.chainId]) {
          chains[chain.chainId] = chain;
        }
      });
      DzapClient.chainConfig = chains;
    }
    return DzapClient.chainConfig;
  }

  public static getDZapAbi(service: AvailableDZapServices) {
    return getDZapAbi(service);
  }

  public static getOtherAbi = (name: OtherAvailableAbis) => {
    return getOtherAbis(name);
  };

  public async getQuotes(request: QuotesRequest): Promise<QuotesResponse> {
    const quotes: QuotesResponse = await fetchQuotes(request);
    const chainConfig = await DzapClient.getChainConfig();
    if (chainConfig === null) {
      return quotes;
    }
    return updateQuotes(quotes, request, this.priceService, chainConfig);
  }

  public async buildTxn(request: BuildTxRequest): Promise<BuildTxResponse> {
    return await buildTransaction(request);
  }

  /**
   * Fetches the status of a bridge or swap transaction.
   *
   * For multiple transactions, provide a comma-separated list of txIds values (srcChainId-txHash).
   * For a single transaction, provide both txHash and chainId.
   * Either txIds or both txHash and chainId must be provided.
   */
  public getStatus({
    txHash,
    txIds,
    chainId,
  }: {
    txHash?: string;
    txIds?: string;
    chainId?: string;
  }): Promise<StatusResponse | Record<string, StatusResponse>> {
    return fetchStatus({ txHash, txIds, chainId });
  }

  public getAllSupportedChains(): Promise<ChainData> {
    return fetchAllSupportedChains();
  }

  public async getAllTokens(chainId: number, source?: string, account?: string) {
    try {
      const [tokensResult, chainConfigResult] = await Promise.allSettled([fetchAllTokens(chainId, source, account), DzapClient.getChainConfig()]);

      const tokens = tokensResult.status === 'fulfilled' ? tokensResult.value : {};
      const chainConfig = chainConfigResult.status === 'fulfilled' ? chainConfigResult.value : null;

      if (!chainConfig) return tokens;

      return await updateTokenListPrices(tokens, chainId, chainConfig, this.priceService);
    } catch (error) {
      console.error('Error fetching or updating tokens:', error);
      return {};
    }
  }

  public async getTokenDetails(tokenAddress: string, chainId: number, account?: string, includeBalance?: boolean, includePrice?: boolean) {
    return await fetchTokenDetails(tokenAddress, chainId, account, includeBalance, includePrice);
  }

  public async getTokenPrice(tokenAddresses: string[], chainId: number): Promise<Record<string, string | null>> {
    const chainConfig = await DzapClient.getChainConfig();
    return await this.priceService.getPrices({ chainId, tokenAddresses, chainConfig });
  }

  public async buildAndSendTransaction({
    chainId,
    request,
    signer,
    txnData,
  }: {
    chainId: number;
    request: BuildTxRequest;
    signer: Signer | WalletClient;
    txnData?: BuildTxResponse;
  }) {
    return await this.contractHandler.buildAndSendTransaction({ chainId, request, signer, txnData });
  }

  public async sendTransaction({ signer, txnData }: { chainId: number; signer: Signer | WalletClient; txnData: ExecuteTxnData }) {
    return await this.contractHandler.sendTransaction({
      signer,
      ...txnData,
    });
  }

  public async decodeTrxData({ data, service, chainId }: { data: TransactionReceipt; service: AvailableDZapServices; chainId: number }) {
    const chainConfig = await DzapClient.getChainConfig();
    if (chainConfig === null || chainConfig?.[chainId] == null) {
      throw new Error('Chains config not found');
    }
    return handleDecodeTrxData(data, service, chainConfig[chainId]);
  }

  public async calculatePoints(request: CalculatePointsRequest): Promise<{ points: number }> {
    return await fetchCalculatedPoints(request);
  }

  public async getDZapContractAddress({ chainId, service }: { chainId: number; service: AvailableDZapServices }): Promise<string> {
    const chainConfig = await DzapClient.getChainConfig();
    if (!chainConfig[chainId].isEnabled || !chainConfig) {
      throw new Error('Chains config not found');
    }

    const chainData = chainConfig[chainId];
    if (!chainData?.contracts) {
      throw new Error(`No contracts found for chain: ${chainId}`);
    }
    const contractMap: Record<AvailableDZapServices, string | undefined> = {
      [Services.bridge]: chainData.contracts.router,
      [Services.swap]: chainData.contracts.router,
      [Services.dca]: chainData.contracts.dca,
      [Services.zap]: chainData.contracts.zap,
    };

    const contractAddress = contractMap[service];

    if (!contractAddress) {
      throw new Error(`Contract not found for service "${service}" on chain: ${chainId}`);
    }

    return contractAddress;
  }

  public async permitAllowance({
    chainId,
    sender,
    data,
    rpcUrls,
  }: {
    chainId: number;
    sender: HexString;
    data: { srcToken: HexString; amount: bigint }[];
    rpcUrls: string[];
  }) {
    return await this.permitHandler.handleGetAllowance({
      chainId,
      sender,
      data,
      rpcUrls,
    });
  }

  public async approvePermit({
    chainId,
    signer,
    sender,
    rpcUrls,
    data,
    approvalTxnCallback,
  }: {
    chainId: number;
    signer: WalletClient | Signer;
    sender: HexString;
    rpcUrls?: string[];
    data: { srcToken: HexString; amountToApprove: bigint }[];
    approvalTxnCallback?: ({
      txnDetails,
      address,
    }: {
      txnDetails: { txnHash: string; code: StatusCodes; status: TxnStatus };
      address: HexString;
    }) => Promise<TxnStatus | void>;
  }) {
    return await this.permitHandler.handleApprove({
      chainId,
      signer,
      sender,
      rpcUrls,
      data,
      approvalTxnCallback,
    });
  }

  public async sign({
    chainId,
    sender,
    data,
    rpcUrls,
    service,
    signer,
    spender,
    signatureCallback,
  }: {
    chainId: number;
    sender: string;
    data: {
      srcToken: string;
      permitData?: string;
      amount: string;
    }[];
    service: AvailableDZapServices;
    rpcUrls?: string[];
    spender: string;
    signer: WalletClient | Wallet;
    signatureCallback?: ({ permitData, srcToken, amount }: { permitData: HexString; srcToken: string; amount: bigint }) => Promise<void>;
  }) {
    return await this.permitHandler.handleSign({
      chainId,
      sender,
      data,
      rpcUrls,
      service,
      signer,
      spender,
      signatureCallback,
    });
  }

  public async executeZapTransaction({ chainId, data, signer }: { chainId: number; data: ZapTxnDetails; signer: WalletClient | Signer }) {
    return await this.zapHandler.execute({
      chainId,
      data,
      signer,
    });
  }

  public async zap({ chainId, data, signer }: { chainId: number; data: ZapTransactionStep[]; signer: WalletClient | Signer }) {
    return await this.zapHandler.zap({
      chainId,
      data,
      signer,
    });
  }

  public async buildZapTransaction(request: ZapBuildTxnRequest): Promise<ZapBuildTxnResponse> {
    if (this.cancelTokenSource) {
      this.cancelTokenSource.cancel('Cancelled due to new request');
    }
    this.cancelTokenSource = Axios.CancelToken.source();
    const route: ZapBuildTxnResponse = (await fetchZapBuildTxnData(request, this.cancelTokenSource.token)).data;
    return route;
  }

  public async getZapQuote(request: ZapQuoteRequest): Promise<ZapQuoteResponse> {
    if (this.cancelTokenSource) {
      this.cancelTokenSource.cancel('Cancelled due to new request');
    }
    this.cancelTokenSource = Axios.CancelToken.source();
    const route: ZapQuoteResponse = (await fetchZapQuote(request, this.cancelTokenSource.token)).data;
    return route;
  }

  public async getZapTxnStatus(request: ZapTxnStatusRequest): Promise<ZapTxnStatusResponse> {
    const status: ZapTxnStatusResponse = (await fetchZapTxnStatus(request)).data;
    return status;
  }
}

export default DzapClient;
