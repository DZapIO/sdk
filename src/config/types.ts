/**
 * SDK configuration interface
 */
export type DZapConfig = {
  /** API key for authentication */
  readonly apiKey: string | null;

  /** Custom RPC URLs by chain ID */
  readonly rpcUrlsByChainId: Readonly<Record<number, readonly string[]>>;

  /** Chain IDs where EIP-2612 is disabled */
  readonly eip2612DisabledChains: readonly number[];

  /** Base API URL */
  readonly baseApiUrl: string;

  /** Zap API URL */
  readonly zapApiUrl: string;

  /** API version (e.g., 'v1/') */
  readonly versionPostfix: string;

  /** Request timeout in milliseconds */
  readonly timeout: number;

  /** Number of retry attempts */
  readonly retries: number;
};

/**
 * Partial configuration options for creating config
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
