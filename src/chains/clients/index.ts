import { chainTypes } from '../../constants/chains';
import type { ChainType } from '../../types/chains';
import { getChainType } from '../../utils/chainType';
import { ValidationError } from '../../utils/errors';
import { BitcoinClient } from './bitcoin';
import { EvmClient } from './evm';
import { SolanaClient } from './solana';
import { SuiClient } from './sui';
import type { IChainClient } from './types';

/**
 * Returns a chain client for the given chain ID.
 * Client for talking to a chain (EVM, Solana, Sui, Bitcoin, etc.).
 * @throws Error if the chain is not supported
 */

const chainClientTypes: Partial<Record<ChainType, new () => IChainClient>> = {
  [chainTypes.svm]: SolanaClient,
  [chainTypes.suivm]: SuiClient,
  [chainTypes.bvm]: BitcoinClient,
  [chainTypes.evm]: EvmClient,
};

export function getChainClient(chainId: number): IChainClient {
  const chainType = getChainType(chainId);
  const chainClientType = chainClientTypes[chainType];
  if (!chainClientType) {
    throw new ValidationError(`Unsupported chain ID: ${chainId}`);
  }
  const chainClient = new chainClientType();
  if (!chainClient.isChainSupported(chainId)) {
    throw new ValidationError(`Unsupported chain ID: ${chainId}`);
  }
  return chainClient;
}

export * from './base';
export * from './bitcoin';
export * from './evm';
export * from './solana';
export * from './sui';
export * from './types';
