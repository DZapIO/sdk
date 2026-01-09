import { CancelTokenSource } from 'axios';
import { fetchAllSupportedChains } from '../api';
import { config } from '../config';
import { Services } from '../constants';
import { PriceService } from '../service/price';
import { AvailableDZapServices, Chain, ChainData } from '../types';
import { ChainsService } from '../service/chains';
import { TradeService } from '../service/trade';
import { TokenService } from '../service/token';
import { ZapService } from '../service/zap';
import { ApprovalsService } from '../service/approvals';
import { TransactionsService } from '../service/transactions';
import { ContractsService } from '../service/contracts';

class DZapClient {
  private static instance: DZapClient;
  private cancelTokenSource: CancelTokenSource | null = null;
  private static chainConfig: ChainData | null = null;
  private priceService: PriceService;

  public readonly chains: ChainsService;
  public readonly trade: TradeService;
  public readonly tokens: TokenService;
  public readonly zap: ZapService;
  public readonly approvals: ApprovalsService;
  public readonly transactions: TransactionsService;
  public readonly contracts: ContractsService;

  private constructor() {
    this.priceService = new PriceService();

    // Initialize service modules
    this.chains = new ChainsService();
    this.trade = new TradeService(
      this.priceService,
      () => DZapClient.getChainConfig(),
      (params) => this.getDZapContractAddress(params),
    );
    this.tokens = new TokenService(this.priceService, () => DZapClient.getChainConfig());
    this.zap = new ZapService(
      () => this.cancelTokenSource,
      (source) => {
        this.cancelTokenSource = source;
      },
    );
    this.approvals = new ApprovalsService(
      () => DZapClient.getChainConfig(),
      (params) => this.getDZapContractAddress(params),
    );
    this.transactions = new TransactionsService();
    this.contracts = new ContractsService(() => DZapClient.getChainConfig());
  }

  /**
   * Returns the singleton instance of DZapClient with optional custom RPC configuration.
   * This ensures only one instance of the client exists throughout the application lifecycle.
   *
   * @param apiKey - Optional API key for DZap services
   * @param rpcUrlsByChainId - Optional mapping of chain IDs to custom RPC URLs for blockchain interactions
   * @returns The singleton DZapClient instance
   *
   * @example
   * ```typescript
   * // Basic initialization
   * const client = DZapClient.getInstance();
   *
   * // With API key
   * const client = DZapClient.getInstance('your-api-key');
   *
   * // With custom RPC URLs
   * const client = DZapClient.getInstance('your-api-key', {
   *   1: ['https://eth.llamarpc.com'],
   *   42161: ['https://arbitrum.llamarpc.com']
   * });
   * ```
   */
  public static getInstance(apiKey?: string, rpcUrlsByChainId?: Record<number, string[]>): DZapClient {
    if (!DZapClient.instance) {
      DZapClient.instance = new DZapClient();
    }
    if (apiKey) {
      config.setApiKey(apiKey);
    }
    if (rpcUrlsByChainId) {
      config.setRpcUrlsByChainId(rpcUrlsByChainId);
    }
    return DZapClient.instance;
  }

  /**
   * Internal method to fetch and cache chain configuration
   * @internal
   */
  private static async getChainConfig(): Promise<ChainData> {
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
   * Internal method to get DZap contract address for a service
   * @internal
   */
  private async getDZapContractAddress({ chainId, service }: { chainId: number; service: AvailableDZapServices }): Promise<string> {
    const chainConfig = await DZapClient.getChainConfig();
    if (!chainConfig[chainId]?.isEnabled || !chainConfig) {
      throw new Error('Chains config not found');
    }

    const chainData = chainConfig[chainId];
    if (!chainData?.contracts) {
      throw new Error(`No contracts found for chain: ${chainId}`);
    }

    const contractMap: Record<string, string | undefined> = {
      [Services.trade]: chainData.contracts.router,
      [Services.dca]: chainData.contracts.dca,
      [Services.zap]: chainData.contracts.zap,
    };

    const contractAddress = contractMap[service];

    if (!contractAddress) {
      throw new Error(`Contract not found for service "${service}" on chain: ${chainId}`);
    }

    return contractAddress;
  }
}

export default DZapClient;
