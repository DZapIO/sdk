import { chainTypes, nonEvmChainids } from '../constants/chains';
import type { ChainType } from '../types/chains';

/** Chain ID → chain type. Single source of truth for non-EVM chains. */
const nonEvmChainIdToType: Record<number, ChainType> = {
  [nonEvmChainids.solana]: chainTypes.svm,
  [nonEvmChainids.sui]: chainTypes.suivm,
  [nonEvmChainids.bitcoin]: chainTypes.bvm,
  [nonEvmChainids.bitcoinTestnet]: chainTypes.bvm,
  [nonEvmChainids.ton]: chainTypes.tonvm,
  [nonEvmChainids.tron]: chainTypes.tronvm,
  [nonEvmChainids.aptos]: chainTypes.aptosvm,
};

export function getChainType(chainId: number): ChainType {
  return nonEvmChainIdToType[chainId] ?? chainTypes.evm;
}
