import { chainTypes, nonEvmChainids } from '../constants/chains';

/** Chain ID → chain type. Single source of truth for non-EVM chains. */
const nonEvmChainIdToType: Record<number, string> = {
  [nonEvmChainids.solana]: chainTypes.svm,
  [nonEvmChainids.sui]: chainTypes.suivm,
  [nonEvmChainids.bitcoin]: chainTypes.bvm,
  [nonEvmChainids.bitcoinTestnet]: chainTypes.bvm,
  [nonEvmChainids.ton]: chainTypes.tonvm,
  [nonEvmChainids.tron]: chainTypes.tronvm,
  [nonEvmChainids.aptos]: chainTypes.aptosvm,
};

export function getChainType(chainId: number): string {
  return nonEvmChainIdToType[chainId] ?? chainTypes.evm;
}
