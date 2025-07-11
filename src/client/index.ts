import Axios, { CancelTokenSource } from 'axios';
import { Signer, Wallet } from 'ethers';
import { Services } from 'src/constants';
import ContractHandler from 'src/contractHandler';
import PermitHandler from 'src/contractHandler/permitHandler';
import { StatusCodes, TxnStatus } from 'src/enums';
import { PriceService } from 'src/service/price';
import {
  ApprovalMode,
  AvailableDZapServices,
  BuildTxRequest,
  BuildTxResponse,
  CalculatePointsRequest,
  Chain,
  ChainData,
  ExecuteTxnData,
  HexString,
  OtherAvailableAbis,
  PermitMode,
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
import { approveToken, getAllowance } from 'src/utils/erc20';
import { getPermit2Address } from 'src/utils/permit/permit2Methods';
import { PermitTypes } from 'src/constants/permit';
import { ApprovalModes } from 'src/constants/approval';

class DZapClient {
  private static instance: DZapClient;
  private cancelTokenSource: CancelTokenSource | null = null;
  private contractHandler: ContractHandler;
  private permitHandler: PermitHandler;
  private zapHandler: ZapHandler;
  private static chainConfig: ChainData | null = null;
  private priceService;
  public rpcUrlsByChainId: Record<number, string[]> = {};
  private constructor(rpcUrlsByChainId?: Record<number, string[]>) {
    this.contractHandler = ContractHandler.getInstance();
    this.permitHandler = PermitHandler.getInstance();
    this.priceService = new PriceService();
    this.zapHandler = ZapHandler.getInstance();
    if (rpcUrlsByChainId) {
      this.rpcUrlsByChainId = rpcUrlsByChainId;
    }
  }

  /**
   * Returns the singleton instance of DZapClient.
   */
  public static getInstance(rpcUrlsByChainId?: Record<number, string[]>): DZapClient {
    if (!DZapClient.instance) {
      DZapClient.instance = new DZapClient(rpcUrlsByChainId);
    }
    return DZapClient.instance;
  }

  /**
   * Fetches and caches all supported chain configurations.
   * @returns {Promise<ChainData>} Mapping of chain IDs to chain configuration objects.
   */
  public static async getChainConfig(): Promise<ChainData> {
    if (!DZapClient.chainConfig) {
      const data = await fetchAllSupportedChains();
      const chains: ChainData = {};
      data.forEach((chain: Chain) => {
        if (!chains[chain.chainId]) {
          chains[chain.chainId] = chain;
        }
      });
      DZapClient.chainConfig = chains;
    }
    return DZapClient.chainConfig;
  }

  /**
   * Returns the ABI for a given DZap service.
   * @param service The DZap service name.
   */
  public static getDZapAbi(service: AvailableDZapServices) {
    return getDZapAbi(service);
  }

  /**
   * Returns the ABI for a given non-core contract.
   * @param name The contract name.
   */
  public static getOtherAbi = (name: OtherAvailableAbis) => {
    return getOtherAbis(name);
  };

  /**
   * Fetches quotes for swaps/bridges based on the request.
   * @param request The quotes request object.
   * @returns {Promise<QuotesResponse>} Quotes for the requested swap/bridge.
   */
  public async getQuotes(request: QuotesRequest): Promise<QuotesResponse> {
    const quotes: QuotesResponse = await fetchQuotes(request);
    const chainConfig = await DZapClient.getChainConfig();
    if (chainConfig === null) {
      return quotes;
    }
    return updateQuotes(quotes, request, this.priceService, chainConfig);
  }

  /**
   * Builds a transaction for a swap or bridge operation.
   * @param request The build transaction request object.
   * @returns {Promise<BuildTxResponse>} The built transaction data.
   */
  public async buildTxn(request: BuildTxRequest): Promise<BuildTxResponse> {
    return await buildTransaction(request);
  }

  /**
   * Fetches the status of a bridge or swap transaction.
   * For multiple transactions, provide a comma-separated list of txIds values (srcChainId-txHash).
   * For a single transaction, provide both txHash and chainId.
   * Either txIds or both txHash and chainId must be provided.
   * @param params Object containing txHash, txIds, and/or chainId.
   * @returns {Promise<StatusResponse | Record<string, StatusResponse>>}
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

  /**
   * Fetches all supported chains and their configuration.
   * @returns {Promise<ChainData>} Mapping of chain IDs to chain configuration objects.
   */
  public getAllSupportedChains(): Promise<ChainData> {
    return fetchAllSupportedChains();
  }

  /**
   * Fetches all tokens for a given chain, optionally updating prices.
   * @param chainId The chain ID.
   * @param source (Optional) Source identifier.
   * @param account (Optional) Account address.
   * @returns Token list with updated prices if available.
   */
  public async getAllTokens(chainId: number, source?: string, account?: string) {
    try {
      const [tokensResult, chainConfigResult] = await Promise.allSettled([fetchAllTokens(chainId, source, account), DZapClient.getChainConfig()]);

      const tokens = tokensResult.status === 'fulfilled' ? tokensResult.value : {};
      const chainConfig = chainConfigResult.status === 'fulfilled' ? chainConfigResult.value : null;

      if (!chainConfig) return tokens;

      return await updateTokenListPrices(tokens, chainId, chainConfig, this.priceService);
    } catch (error) {
      console.error('Error fetching or updating tokens:', error);
      return {};
    }
  }

  /**
   * Fetches details for a specific token on a chain.
   * @param tokenAddress The token contract address.
   * @param chainId The chain ID.
   * @param account (Optional) Account address.
   * @param includeBalance (Optional) Whether to include balance.
   * @param includePrice (Optional) Whether to include price.
   */
  public async getTokenDetails(tokenAddress: string, chainId: number, account?: string, includeBalance?: boolean, includePrice?: boolean) {
    return await fetchTokenDetails(tokenAddress, chainId, account, includeBalance, includePrice);
  }

  /**
   * Fetches prices for a list of token addresses on a chain.
   * @param tokenAddresses Array of token contract addresses.
   * @param chainId The chain ID.
   * @returns {Promise<Record<string, string | null>>} Mapping of token address to price.
   */
  public async getTokenPrice(tokenAddresses: string[], chainId: number): Promise<Record<string, string | null>> {
    const chainConfig = await DZapClient.getChainConfig();
    return await this.priceService.getPrices({ chainId, tokenAddresses, chainConfig });
  }

  /**
   * Builds and sends a transaction using the provided signer.
   * @param params Object containing chainId, request, signer, and optional txnData.
   */
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

  /**
   * Sends a transaction using the provided signer and transaction data.
   * @param params Object containing chainId, signer, and txnData.
   */
  public async sendTransaction({ signer, txnData }: { chainId: number; signer: Signer | WalletClient; txnData: ExecuteTxnData }) {
    return await this.contractHandler.sendTransaction({
      signer,
      ...txnData,
    });
  }

  /**
   * Decodes transaction data for a given service and chain.
   * @param params Object containing data, service, and chainId.
   */
  public async decodeTrxData({ data, service, chainId }: { data: TransactionReceipt; service: AvailableDZapServices; chainId: number }) {
    const chainConfig = await DZapClient.getChainConfig();
    if (chainConfig === null || chainConfig?.[chainId] == null) {
      throw new Error('Chains config not found');
    }
    return handleDecodeTrxData(data, service, chainConfig[chainId]);
  }

  /**
   * Calculates user points for swaps/bridges.
   * @param request The points calculation request object.
   * @returns {Promise<{ points: number }>} The calculated points.
   */
  public async calculatePoints(request: CalculatePointsRequest): Promise<{ points: number }> {
    return await fetchCalculatedPoints(request);
  }

  /**
   * Returns the contract address for a given service and chain.
   * @param params Object containing chainId and service.
   * @returns {Promise<string>} The contract address.
   */
  public async getDZapContractAddress({ chainId, service }: { chainId: number; service: AvailableDZapServices }): Promise<string> {
    const chainConfig = await DZapClient.getChainConfig();
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

  /**
   * Gets token allowances for a sender.
   * @param params Object containing chainId, sender, data, rpcUrls, service and mode.
   */
  public async getAllowance({
    chainId,
    sender,
    data,
    rpcUrls,
    service,
    mode = ApprovalModes.AutoPermit,
  }: {
    chainId: number;
    sender: HexString;
    data: { srcToken: HexString; amount: bigint }[];
    rpcUrls?: string[];
    service: AvailableDZapServices;
    mode?: ApprovalMode;
  }) {
    const dZapContractAddress = (await this.getDZapContractAddress({ chainId, service })) as HexString;
    return await getAllowance({
      chainId,
      sender,
      data,
      rpcUrls: rpcUrls || this.rpcUrlsByChainId[chainId],
      mode,
      dZapContractAddress,
    });
  }

  /**
   * Approves tokens for spending (Permit2 only).
   * @param params Object containing chainId, signer, sender, rpcUrls, data, service and mode and approvalTxnCallback.
   */
  public async approve({
    chainId,
    signer,
    sender,
    rpcUrls,
    data,
    approvalTxnCallback,
    mode = ApprovalModes.AutoPermit,
    service,
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
    mode?: ApprovalMode;
    service: AvailableDZapServices;
  }) {
    const spender =
      mode === ApprovalModes.Permit2 || mode === ApprovalModes.AutoPermit
        ? getPermit2Address(chainId)
        : ((await this.getDZapContractAddress({ chainId, service })) as HexString);
    return await approveToken({
      chainId,
      signer,
      sender,
      rpcUrls: rpcUrls || this.rpcUrlsByChainId[chainId],
      data,
      approvalTxnCallback,
      spender,
    });
  }

  /**
   * Signs permit data for tokens (EIP2612Permit/Permit2).
   * @param params Object containing chainId, sender, data, service, rpcUrls, spender, signer, permitType, and optional signatureCallback.
   */
  public async sign({
    chainId,
    sender,
    data,
    rpcUrls,
    service,
    signer,
    spender,
    permitType = PermitTypes.AutoPermit,
    signatureCallback,
  }: {
    chainId: number;
    sender: HexString;
    data: {
      srcToken: HexString;
      permitData?: HexString;
      amount: string;
    }[];
    service: AvailableDZapServices;
    rpcUrls?: string[];
    spender: HexString;
    signer: WalletClient | Wallet;
    permitType?: PermitMode;
    signatureCallback?: ({ permitData, srcToken, amount }: { permitData: HexString; srcToken: string; amount: bigint }) => Promise<void>;
  }) {
    return await this.permitHandler.signPermit({
      chainId,
      sender,
      data,
      rpcUrls: rpcUrls || this.rpcUrlsByChainId[chainId],
      service,
      signer,
      spender,
      permitType,
      signatureCallback,
    });
  }

  /**
   * Executes a zap transaction, expects txnData
   * @param params Object containing chainId, txnData, and signer.
   */
  public async executeZapTransaction({ chainId, txnData, signer }: { chainId: number; txnData: ZapTxnDetails; signer: WalletClient | Signer }) {
    return await this.zapHandler.execute({
      chainId,
      txnData,
      signer,
    });
  }

  /**
   * Executes a zap transaction, expects steps from buildTransaction call.
   * @param params Object containing chainId, steps, and signer.
   */
  public async zap({ chainId, steps, signer }: { chainId: number; steps: ZapTransactionStep[]; signer: WalletClient | Signer }) {
    return await this.zapHandler.zap({
      chainId,
      steps,
      signer,
    });
  }

  /**
   * Builds a zap transaction.
   * @param request The zap build transaction request object.
   * @returns {Promise<ZapBuildTxnResponse>} The built zap transaction data.
   */
  public async buildZapTransaction(request: ZapBuildTxnRequest): Promise<ZapBuildTxnResponse> {
    if (this.cancelTokenSource) {
      this.cancelTokenSource.cancel('Cancelled due to new request');
    }
    this.cancelTokenSource = Axios.CancelToken.source();
    const route: ZapBuildTxnResponse = (await fetchZapBuildTxnData(request, this.cancelTokenSource.token)).data;
    return route;
  }

  /**
   * Fetches a zap quote.
   * @param request The zap quote request object.
   * @returns {Promise<ZapQuoteResponse>} The zap quote response.
   */
  public async getZapQuote(request: ZapQuoteRequest): Promise<ZapQuoteResponse> {
    if (this.cancelTokenSource) {
      this.cancelTokenSource.cancel('Cancelled due to new request');
    }
    this.cancelTokenSource = Axios.CancelToken.source();
    const route: ZapQuoteResponse = (await fetchZapQuote(request, this.cancelTokenSource.token)).data;
    return route;
  }

  /**
   * Fetches the status of a zap transaction.
   * @param request The zap transaction status request object.
   * @returns {Promise<ZapTxnStatusResponse>} The zap transaction status response.
   */
  public async getZapTxnStatus(request: ZapTxnStatusRequest): Promise<ZapTxnStatusResponse> {
    const status: ZapTxnStatusResponse = (await fetchZapTxnStatus(request)).data;
    return status;
  }
}

export default DZapClient;
