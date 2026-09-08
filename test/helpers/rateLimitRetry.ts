export const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const TRADE_API_DELAY_MS = 5_000;
export const ZAP_API_DELAY_MS = 1_000;
export const BUILD_API_DELAY_MS = TRADE_API_DELAY_MS;
export const QUOTES_API_DELAY_MS = 3_000;
export const STATUS_API_DELAY_MS = 3_000;
export const RATE_LIMIT_RETRY_DELAY_MS = 12_000;
export const MAX_RATE_LIMIT_RETRIES = 5;

export type RateLimitRetryOptions = {
  maxRetries?: number;
  retryDelayMs?: number;
};

const isRateLimitError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'response' in error &&
  typeof (error as { response?: { status?: number } }).response?.status === 'number' &&
  (error as { response: { status: number } }).response.status === 429;

export function withRateLimitRetry<T>(fn: () => Promise<T>, options?: RateLimitRetryOptions): Promise<T>;
export function withRateLimitRetry<T>(label: string, fn: () => Promise<T>, options?: RateLimitRetryOptions): Promise<T>;
export async function withRateLimitRetry<T>(
  labelOrFn: string | (() => Promise<T>),
  fnOrOptions?: (() => Promise<T>) | RateLimitRetryOptions,
  maybeOptions?: RateLimitRetryOptions,
): Promise<T> {
  const label = typeof labelOrFn === 'string' ? labelOrFn : undefined;
  const fn = typeof labelOrFn === 'string' ? (fnOrOptions as () => Promise<T>) : labelOrFn;
  const options = (typeof labelOrFn === 'string' ? maybeOptions : fnOrOptions) as RateLimitRetryOptions | undefined;

  const maxRetries = options?.maxRetries ?? MAX_RATE_LIMIT_RETRIES;
  const retryDelayMs = options?.retryDelayMs ?? RATE_LIMIT_RETRY_DELAY_MS;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await fn();
    } catch (error: unknown) {
      if (!isRateLimitError(error) || attempt === maxRetries) {
        throw error;
      }
      await delay(retryDelayMs);
    }
  }

  throw new Error(label ? `${label}: exhausted rate-limit retries` : 'exhausted rate-limit retries');
}
