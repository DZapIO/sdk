import { logger } from './logger';

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
    logger.debug('Invalid URL format', { url, error });
    return false;
  }
}
