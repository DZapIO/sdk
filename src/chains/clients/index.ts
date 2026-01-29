import { chainTypes } from '../../constants/chains';
import { getChainType } from '../../utils/chainType';
import { BitcoinChain } from './bitcoin';
import { EvmChain } from './evm';
import { SolanaChain } from './solana';
import { SuiChain } from './sui';
import type { IChainClient } from './types';

/**
 * Returns an EvmChain instance. Used for EVM-only operations (e.g. sendBatchCalls, waitForBatchTransactionReceipt).
 */
export function getEvmChain(): EvmChain {
  return new EvmChain();
}

/**
 * Returns a chain client for the given chain ID, or undefined if unsupported.
 * Client for talking to a chain (EVM, Solana, Sui, Bitcoin, etc.).
 */
export function getChainClient(chainId: number): IChainClient | undefined {
  const chainType = getChainType(chainId);

  switch (chainType) {
    case chainTypes.svm:
      return new SolanaChain();
    case chainTypes.suivm:
      return new SuiChain();
    case chainTypes.bvm:
      return new BitcoinChain();
    case chainTypes.evm: {
      const evmChain = getEvmChain();
      return evmChain.isChainSupported(chainId) ? evmChain : undefined;
    }
    default:
      return undefined;
  }
}

export * from './base';
export * from './bitcoin';
export * from './evm';
export * from './solana';
export * from './sui';
export * from './types';
