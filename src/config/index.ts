import { isValidUrl } from '../utils/url';

export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public field: string,
  ) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

export type ApiConfig = {
  url: string;
  version: string;
};

export type DZapConfigOptions = {
  apiKey?: string | null;
  rpcUrlsByChainId?: Record<number, string[]>;
  tradeApi?: Partial<ApiConfig>;
  zapApi?: Partial<ApiConfig>;
};

const DEFAULT_CONFIG = {
  apiKey: null,
  rpcUrlsByChainId: {},
  eip2612DisabledChains: [747474], // Katana chain
  tradeApi: {
    url: 'https://api.dzap.io',
    version: 'v1/',
  },
  zapApi: {
    url: 'https://zap.dzap.io',
    version: 'v1/',
  },
} as const;

export class Config {
  private static instance: Config | null = null;

  private _apiKey: string | null;
  private _rpcUrlsByChainId: Record<number, string[]>;
  private _eip2612DisabledChains: number[];
  private _tradeApi: ApiConfig;
  private _zapApi: ApiConfig;

  private constructor(options: DZapConfigOptions = {}) {
    this._apiKey = options.apiKey !== undefined ? options.apiKey : DEFAULT_CONFIG.apiKey;
    this._rpcUrlsByChainId = options.rpcUrlsByChainId
      ? Object.fromEntries(Object.entries(options.rpcUrlsByChainId).map(([chainId, urls]) => [chainId, [...urls]]))
      : {};
    this._eip2612DisabledChains = [...DEFAULT_CONFIG.eip2612DisabledChains];
    this._tradeApi = {
      url: options.tradeApi?.url || DEFAULT_CONFIG.tradeApi.url,
      version: options.tradeApi?.version || DEFAULT_CONFIG.tradeApi.version,
    };
    this._zapApi = {
      url: options.zapApi?.url || DEFAULT_CONFIG.zapApi.url,
      version: options.zapApi?.version || DEFAULT_CONFIG.zapApi.version,
    };

    this.validate();
  }

  /**
   * Get or initialize the singleton instance
   *
   * @param options - Optional configuration options
   * @returns The Config singleton instance
   */
  public static getInstance(options?: DZapConfigOptions): Config {
    const hasOptions = options && Object.keys(options).length > 0;
    if (!Config.instance || hasOptions) {
      Config.instance = new Config(options || {});
    }
    return Config.instance;
  }

  private validateRpcUrls(chainId: number, urls: string[]): void {
    if (!Number.isInteger(chainId) || chainId <= 0) {
      throw new ConfigValidationError(`Invalid chain ID: ${chainId}. Must be a positive integer.`, 'rpcUrlsByChainId');
    }

    if (!Array.isArray(urls) || urls.length === 0) {
      throw new ConfigValidationError(`Invalid RPC URLs for chain ${chainId}. Must be a non-empty array.`, 'rpcUrlsByChainId');
    }

    urls.forEach((url, index) => {
      if (typeof url !== 'string' || !isValidUrl(url)) {
        throw new ConfigValidationError(`Invalid RPC URL at index ${index} for chain ${chainId}: "${url}"`, 'rpcUrlsByChainId');
      }
    });
  }

  private validate(): void {
    if (!isValidUrl(this._tradeApi.url)) {
      throw new ConfigValidationError(`Invalid tradeApi.url: "${this._tradeApi.url}". Must be a valid URL.`, 'tradeApi.url');
    }

    if (typeof this._tradeApi.version !== 'string' || this._tradeApi.version.length === 0) {
      throw new ConfigValidationError('Invalid tradeApi.version. Must be a non-empty string.', 'tradeApi.version');
    }

    if (!isValidUrl(this._zapApi.url)) {
      throw new ConfigValidationError(`Invalid zapApi.url: "${this._zapApi.url}". Must be a valid URL.`, 'zapApi.url');
    }

    if (typeof this._zapApi.version !== 'string' || this._zapApi.version.length === 0) {
      throw new ConfigValidationError('Invalid zapApi.version. Must be a non-empty string.', 'zapApi.version');
    }

    Object.entries(this._rpcUrlsByChainId).forEach(([chainId, urls]) => {
      this.validateRpcUrls(Number(chainId), urls);
    });

    if (!Array.isArray(this._eip2612DisabledChains)) {
      throw new ConfigValidationError('Invalid eip2612DisabledChains. Must be an array.', 'eip2612DisabledChains');
    }

    this._eip2612DisabledChains.forEach((chainId, index) => {
      if (!Number.isInteger(chainId) || chainId <= 0) {
        throw new ConfigValidationError(`Invalid chain ID at index ${index}: ${chainId}. Must be a positive integer.`, 'eip2612DisabledChains');
      }
    });
  }

  public get apiKey(): string | null {
    return this._apiKey;
  }

  public get tradeApi(): ApiConfig {
    return { ...this._tradeApi };
  }

  public get zapApi(): ApiConfig {
    return { ...this._zapApi };
  }

  /**
   * Get EIP-2612 disabled chains array
   * @returns Array of chain IDs where EIP-2612 is disabled
   */
  public get eip2612DisabledChains(): number[] {
    return [...this._eip2612DisabledChains];
  }

  /**
   * Get RPC URLs for a specific chain Id
   * @param chainId - The chain ID to get RPC URLs for
   * @returns Array of RPC URLs for the chain, or empty array if none configured
   */
  public getRpcUrlsByChainId(chainId: number): string[] {
    return this._rpcUrlsByChainId[chainId] ? [...this._rpcUrlsByChainId[chainId]] : [];
  }

  /**
   * Set RPC URLs for a specific chain ID
   * @param chainId - The chain ID to set RPC URLs for
   * @param urls - Array of RPC URLs for the chain
   * @throws ConfigValidationError if validation fails
   */
  public setRpcUrlsByChainId(chainId: number, urls: string[]): void {
    this.validateRpcUrls(chainId, urls);
    this._rpcUrlsByChainId[chainId] = [...urls];
  }
}
