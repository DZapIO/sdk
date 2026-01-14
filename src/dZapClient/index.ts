import { CancelTokenSource } from 'axios';
import { fetchAllSupportedChains } from '../api';
import { config, DZapConfigOptions } from '../config';
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
   * Returns the singleton instance of DZapClient with the provided configuration.
   *
   * @param configOptions - Configuration options for the SDK
   * @returns DZapClient instance
   *
   * @example
   * ```typescript
   * // Basic initialization
   * const client = DZapClient.getInstance({
   *   apiKey: 'your-api-key'
   * });
   *
   * // With custom RPC URLs
   * const clientWithRpc = DZapClient.getInstance({
   *   apiKey: 'your-api-key',
   *   rpcUrlsByChainId: {
   *     1: ['https://eth.llamarpc.com'],
   *     42161: ['https://arbitrum.llamarpc.com']
   *   }
   * });
   * ```
   */
  public static getInstance(configOptions: DZapConfigOptions = {}): DZapClient {
    if (configOptions && Object.keys(configOptions).length > 0) {
      config.updateConfig(configOptions);
    }

    if (!DZapClient.instance) {
      DZapClient.instance = new DZapClient();
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
