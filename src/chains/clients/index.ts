import { chainTypes } from '../../constants/chains';
import { getChainType } from '../../utils/chainType';
import { ValidationError } from '../../utils/errors';
import { BitcoinChain } from './bitcoin';
import { EvmChain } from './evm';
import { SolanaChain } from './solana';
import { SuiChain } from './sui';
import type { IChainClient } from './types';

/**
 * Returns a chain client for the given chain ID.
 * Client for talking to a chain (EVM, Solana, Sui, Bitcoin, etc.).
 * @throws Error if the chain is not supported
 */
export function getChainClient(chainId: number): IChainClient {
  const chainType = getChainType(chainId);
  switch (chainType) {
    case chainTypes.svm:
      return new SolanaChain();
    case chainTypes.suivm:
      return new SuiChain();
    case chainTypes.bvm:
      return new BitcoinChain();
    case chainTypes.evm: {
      const evmChain = new EvmChain();
      if (!evmChain.isChainSupported(chainId)) {
        throw new ValidationError(`Unsupported chain ID: ${chainId}`);
      }
      return evmChain;
    }
    default:
      throw new ValidationError(`Unsupported chain ID: ${chainId}`);
  }
}

export * from './base';
export * from './bitcoin';
export * from './evm';
export * from './solana';
export * from './sui';
export * from './types';
