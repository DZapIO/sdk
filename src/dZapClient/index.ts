import { TradeApiClient } from '../api';
import type { DZapConfigOptions } from '../config';
import { config } from '../config';
import { ApprovalsService } from '../service/approvals';
import { ChainsService } from '../service/chains';
import { ContractsService } from '../service/contracts';
import { PriceService } from '../service/price';
import { TokenService } from '../service/token';
import { TradeService } from '../service/trade';
import { TransactionsService } from '../service/transactions';
import { ZapService } from '../service/zap';
import type { Chain, ChainData } from '../types';

class DZapClient {
  private static instance: DZapClient;
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
    this.contracts = new ContractsService(() => DZapClient.getChainConfig());
    this.trade = new TradeService(
      this.priceService,
      () => DZapClient.getChainConfig(),
      (params) => this.contracts.getAddress(params),
    );
    this.tokens = new TokenService(this.priceService, () => DZapClient.getChainConfig());
    this.zap = new ZapService();
    this.approvals = new ApprovalsService(
      () => DZapClient.getChainConfig(),
      (params) => this.contracts.getAddress(params),
    );
    this.transactions = new TransactionsService();
  }

  /**
   * Returns the singleton instance of DZapClient with the provided configuration.
   *
   * @param configOptions - Optional configuration options for the SDK
   * @returns DZapClient instance
   *
   * @example
   * ```typescript
   * // Initialize without configuration
   * const client = DZapClient.getInstance();
   *
   * // Basic initialization with API key
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
  public static getInstance(configOptions?: DZapConfigOptions): DZapClient {
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
      const data = await TradeApiClient.fetchAllSupportedChains();
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
}

export default DZapClient;
