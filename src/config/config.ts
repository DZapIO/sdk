import { DZapConfig, DZapConfigOptions } from './types';
import { DEFAULT_CONFIG } from './defaults';
import { validateConfig } from './validator';
import { deepFreeze } from '../utils/object';

/**
 * Creates an immutable, validated configuration
 *
 * @param options - Configuration options
 * @returns Frozen configuration object
 *
 * @example
 * ```typescript
 * const config = createConfig({
 *   apiKey: 'your-api-key',
 *   baseApiUrl: 'https://api.dzap.io',
 *   timeout: 60000
 * });
 * ```
 */
export function createConfig(options: DZapConfigOptions = {}): Readonly<DZapConfig> {
  const config: DZapConfig = {
    apiKey: options.apiKey !== undefined ? options.apiKey : DEFAULT_CONFIG.apiKey,
    rpcUrlsByChainId: options.rpcUrlsByChainId || DEFAULT_CONFIG.rpcUrlsByChainId,
    eip2612DisabledChains: options.eip2612DisabledChains || DEFAULT_CONFIG.eip2612DisabledChains,
    baseApiUrl: options.baseApiUrl || DEFAULT_CONFIG.baseApiUrl,
    zapApiUrl: options.zapApiUrl || DEFAULT_CONFIG.zapApiUrl,
    versionPostfix: options.versionPostfix || DEFAULT_CONFIG.versionPostfix,
    timeout: options.timeout !== undefined ? options.timeout : DEFAULT_CONFIG.timeout,
    retries: options.retries !== undefined ? options.retries : DEFAULT_CONFIG.retries,
  };
  validateConfig(config);
  // Freeze and return
  return deepFreeze(config);
}
