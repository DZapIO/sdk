import { DZapConfig, DZapConfigOptions } from './types';
import { createConfig } from './config';

/**
 * Global config instance
 */
let globalConfig: Readonly<DZapConfig> | null = null;

/**
 * Get or initialize the global configuration
 * If options are provided, reinitializes the config
 * If not initialized and no options provided, uses defaults
 *
 * @param options - Optional configuration options
 * @returns The global configuration instance
 */
export function getOrInitConfig(options?: DZapConfigOptions): Readonly<DZapConfig> {
  if (!globalConfig || options) {
    globalConfig = createConfig(options || {});
  }
  return globalConfig;
}
