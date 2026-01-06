import { DZapConfig, ConfigValidationError } from './types';
import { isValidUrl } from '../utils/url';

/**
 * Validates the configuration
 */
export function validateConfig(config: DZapConfig): void {
  // Validate base API URL
  if (!isValidUrl(config.baseApiUrl)) {
    throw new ConfigValidationError(`Invalid baseApiUrl: "${config.baseApiUrl}". Must be a valid URL.`, 'baseApiUrl');
  }

  // Validate zap API URL
  if (!isValidUrl(config.zapApiUrl)) {
    throw new ConfigValidationError(`Invalid zapApiUrl: "${config.zapApiUrl}". Must be a valid URL.`, 'zapApiUrl');
  }

  // Validate timeout
  if (typeof config.timeout !== 'number' || config.timeout < 1000) {
    throw new ConfigValidationError(`Invalid timeout: ${config.timeout}. Must be at least 1000ms.`, 'timeout');
  }

  if (config.timeout > 300000) {
    throw new ConfigValidationError(`Invalid timeout: ${config.timeout}. Must not exceed 300000ms (5 minutes).`, 'timeout');
  }

  // Validate retries
  if (typeof config.retries !== 'number' || config.retries < 0 || config.retries > 10) {
    throw new ConfigValidationError(`Invalid retries: ${config.retries}. Must be between 0 and 10.`, 'retries');
  }

  // Validate version postfix
  if (typeof config.versionPostfix !== 'string' || config.versionPostfix.length === 0) {
    throw new ConfigValidationError('Invalid versionPostfix. Must be a non-empty string.', 'versionPostfix');
  }

  // Validate RPC URLs
  Object.entries(config.rpcUrlsByChainId).forEach(([chainId, urls]) => {
    const chainIdNum = Number(chainId);

    if (!Number.isInteger(chainIdNum) || chainIdNum <= 0) {
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
  });

  // Validate disabled chains
  if (!Array.isArray(config.eip2612DisabledChains)) {
    throw new ConfigValidationError('Invalid eip2612DisabledChains. Must be an array.', 'eip2612DisabledChains');
  }

  config.eip2612DisabledChains.forEach((chainId, index) => {
    if (!Number.isInteger(chainId) || chainId <= 0) {
      throw new ConfigValidationError(`Invalid chain ID at index ${index}: ${chainId}. Must be a positive integer.`, 'eip2612DisabledChains');
    }
  });
}
