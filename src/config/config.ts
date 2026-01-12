/**
 * Configuration validation error
 */
export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public field: string,
  ) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Configuration options for creating config
 */
export type DZapConfigOptions = {
  apiKey?: string | null;
  rpcUrlsByChainId?: Record<number, string[]>;
  eip2612DisabledChains?: number[];
  baseApiUrl?: string;
  zapApiUrl?: string;
  versionPostfix?: string;
  timeout?: number;
  retries?: number;
};

/**
 * Validates a URL string
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  apiKey: null,
  rpcUrlsByChainId: {},
  eip2612DisabledChains: [747474], // Katana chain
  baseApiUrl: 'https://api.dzap.io',
  zapApiUrl: 'https://zap.dzap.io',
  versionPostfix: 'v1/',
  timeout: 30000, // 30 seconds
  retries: 2,
};

/**
 * Singleton configuration class for DZap SDK
 */
export class Config {
  private static instance: Config | null = null;

  private _apiKey: string | null;
  private _rpcUrlsByChainId: Record<number, string[]>;
  private _eip2612DisabledChains: number[];
  private _baseApiUrl: string;
  private _zapApiUrl: string;
  private _versionPostfix: string;
  private _timeout: number;
  private _retries: number;

  private constructor(options: DZapConfigOptions = {}) {
    this._apiKey = options.apiKey !== undefined ? options.apiKey : DEFAULT_CONFIG.apiKey;
    this._rpcUrlsByChainId = options.rpcUrlsByChainId
      ? Object.fromEntries(Object.entries(options.rpcUrlsByChainId).map(([chainId, urls]) => [chainId, [...urls]]))
      : {};
    this._eip2612DisabledChains = options.eip2612DisabledChains ? [...options.eip2612DisabledChains] : [...DEFAULT_CONFIG.eip2612DisabledChains];
    this._baseApiUrl = options.baseApiUrl || DEFAULT_CONFIG.baseApiUrl;
    this._zapApiUrl = options.zapApiUrl || DEFAULT_CONFIG.zapApiUrl;
    this._versionPostfix = options.versionPostfix || DEFAULT_CONFIG.versionPostfix;
    this._timeout = options.timeout !== undefined ? options.timeout : DEFAULT_CONFIG.timeout;
    this._retries = options.retries !== undefined ? options.retries : DEFAULT_CONFIG.retries;

    this.validate();
  }

  /**
   * Get or initialize the singleton instance
   *
   * @param options - Optional configuration options
   * @returns The Config singleton instance
   */
  public static getInstance(options?: DZapConfigOptions): Config {
    // Only recreate instance if it doesn't exist or if actual options are provided
    const hasOptions = options && Object.keys(options).length > 0;
    if (!Config.instance || hasOptions) {
      Config.instance = new Config(options || {});
    }
    return Config.instance;
  }

  /**
   * Validates RPC URLs for a specific chain
   */
  private validateRpcUrls(chainId: number, urls: string[]): void {
    // Validate chain ID
    if (!Number.isInteger(chainId) || chainId <= 0) {
      throw new ConfigValidationError(`Invalid chain ID: ${chainId}. Must be a positive integer.`, 'rpcUrlsByChainId');
    }

    // Validate URLs array
    if (!Array.isArray(urls) || urls.length === 0) {
      throw new ConfigValidationError(`Invalid RPC URLs for chain ${chainId}. Must be a non-empty array.`, 'rpcUrlsByChainId');
    }

    // Validate each URL
    urls.forEach((url, index) => {
      if (typeof url !== 'string' || !isValidUrl(url)) {
        throw new ConfigValidationError(`Invalid RPC URL at index ${index} for chain ${chainId}: "${url}"`, 'rpcUrlsByChainId');
      }
    });
  }

  /**
   * Validates the configuration
   */
  private validate(): void {
    // Validate base API URL
    if (!isValidUrl(this._baseApiUrl)) {
      throw new ConfigValidationError(`Invalid baseApiUrl: "${this._baseApiUrl}". Must be a valid URL.`, 'baseApiUrl');
    }

    // Validate zap API URL
    if (!isValidUrl(this._zapApiUrl)) {
      throw new ConfigValidationError(`Invalid zapApiUrl: "${this._zapApiUrl}". Must be a valid URL.`, 'zapApiUrl');
    }

    // Validate timeout
    if (typeof this._timeout !== 'number' || !Number.isFinite(this._timeout)) {
      throw new ConfigValidationError(`Invalid timeout: ${this._timeout}. Must be a finite number.`, 'timeout');
    }

    if (this._timeout < 1000) {
      throw new ConfigValidationError(`Invalid timeout: ${this._timeout}. Must be at least 1000ms.`, 'timeout');
    }

    if (this._timeout > 300000) {
      throw new ConfigValidationError(`Invalid timeout: ${this._timeout}. Must not exceed 300000ms (5 minutes).`, 'timeout');
    }

    // Validate retries
    if (typeof this._retries !== 'number' || !Number.isFinite(this._retries)) {
      throw new ConfigValidationError(`Invalid retries: ${this._retries}. Must be a finite number.`, 'retries');
    }

    if (!Number.isInteger(this._retries)) {
      throw new ConfigValidationError(`Invalid retries: ${this._retries}. Must be an integer.`, 'retries');
    }

    if (this._retries < 0 || this._retries > 10) {
      throw new ConfigValidationError(`Invalid retries: ${this._retries}. Must be between 0 and 10.`, 'retries');
    }

    // Validate version postfix
    if (typeof this._versionPostfix !== 'string' || this._versionPostfix.length === 0) {
      throw new ConfigValidationError('Invalid versionPostfix. Must be a non-empty string.', 'versionPostfix');
    }

    // Validate RPC URLs
    Object.entries(this._rpcUrlsByChainId).forEach(([chainId, urls]) => {
      this.validateRpcUrls(Number(chainId), urls);
    });

    // Validate disabled chains
    if (!Array.isArray(this._eip2612DisabledChains)) {
      throw new ConfigValidationError('Invalid eip2612DisabledChains. Must be an array.', 'eip2612DisabledChains');
    }

    this._eip2612DisabledChains.forEach((chainId, index) => {
      if (!Number.isInteger(chainId) || chainId <= 0) {
        throw new ConfigValidationError(`Invalid chain ID at index ${index}: ${chainId}. Must be a positive integer.`, 'eip2612DisabledChains');
      }
    });
  }

  // Getters
  public get apiKey(): string | null {
    return this._apiKey;
  }

  public get baseApiUrl(): string {
    return this._baseApiUrl;
  }

  public get zapApiUrl(): string {
    return this._zapApiUrl;
  }

  public get versionPostfix(): string {
    return this._versionPostfix;
  }

  public get timeout(): number {
    return this._timeout;
  }

  public get retries(): number {
    return this._retries;
  }

  /**
   * Get a copy of the EIP-2612 disabled chains array
   * Returns a copy to prevent external modifications
   *
   * @returns Array of chain IDs where EIP-2612 is disabled
   */
  public get eip2612DisabledChains(): number[] {
    return [...this._eip2612DisabledChains];
  }

  /**
   * Get RPC URLs for a specific chain ID
   * Returns a copy of the array to prevent external modifications
   *
   * @param chainId - The chain ID to get RPC URLs for
   * @returns Array of RPC URLs for the chain, or empty array if none configured
   */
  public getRpcUrlsByChainId(chainId: number): string[] {
    return this._rpcUrlsByChainId[chainId] ? [...this._rpcUrlsByChainId[chainId]] : [];
  }

  /**
   * Set RPC URLs for a specific chain ID
   *
   * @param chainId - The chain ID to set RPC URLs for
   * @param urls - Array of RPC URLs for the chain
   * @throws ConfigValidationError if validation fails
   */
  public setRpcUrlsByChainId(chainId: number, urls: string[]): void {
    this.validateRpcUrls(chainId, urls);
    this._rpcUrlsByChainId[chainId] = [...urls];
  }
}
