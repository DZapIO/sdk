import { DZapConfig } from './types';

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Readonly<DZapConfig> = Object.freeze({
  apiKey: null,
  rpcUrlsByChainId: {},
  eip2612DisabledChains: [747474], // Katana chain
  baseApiUrl: 'https://api.dzap.io',
  zapApiUrl: 'https://zap.dzap.io',
  versionPostfix: 'v1/',
  timeout: 30000, // 30 seconds
  retries: 2,
});
