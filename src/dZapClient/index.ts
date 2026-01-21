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

class DZapClient {
  private static instance: DZapClient;
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
    this.chains = new ChainsService();
    this.contracts = new ContractsService(this.chains);
    this.approvals = new ApprovalsService(this.chains, this.contracts);
    this.trade = new TradeService(this.priceService, this.chains, this.contracts, this.approvals);
    this.tokens = new TokenService(this.priceService, this.chains);
    this.zap = new ZapService();
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
}

export default DZapClient;
