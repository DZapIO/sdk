import { chainIds } from '../constants/chains';
import { chainTypes } from '../constants/chains';

/**
 * Maps chain IDs to their chain types
 */
const chainIdToType: Record<number, string> = {
  [chainIds.solana]: chainTypes.svm,
  [chainIds.sui]: chainTypes.suivm,
  [chainIds.bitcoin]: chainTypes.bvm,
  [chainIds.bitcoinTestnet]: chainTypes.bvm,
  [chainIds.ton]: chainTypes.tonvm,
  [chainIds.tron]: chainTypes.tronvm,
  [chainIds.aptos]: chainTypes.aptosvm,
};

/**
 * Checks if a chain ID is non-EVM
 */
export function isNonEVMChain(chainId: number): boolean {
  return (Object.values(chainIds) as number[]).includes(chainId);
}

/**
 * Gets the chain type for a given chain ID
 * @param chainId - The chain ID to get the type for
 * @returns The chain type ('evm', 'svm', 'suivm', 'bvm', etc.) or 'evm' as default
 */
export function getChainType(chainId: number): string {
  return isNonEVMChain(chainId) ? chainIdToType[chainId] || chainTypes.evm : chainTypes.evm;
}

/**
 * Checks if a chain type is EVM
 */
export function isEVMChainType(chainType: string): boolean {
  return chainType === chainTypes.evm;
}
