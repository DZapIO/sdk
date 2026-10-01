import { config } from '../../config';
import { chainTypes, exclusiveChainIds } from '../../constants/chains';
import { StatusCodes } from '../../enums';
import { ChainData } from '../../types';
import { ChainType } from '../../types/chains';
import { DZapSigner } from '../../types/signer';
import { DZapTxnError } from '../../utils/errors';
import { bvmAdapter } from './bvm';
import { evmAdapter } from './evm';
import { hypevmAdapter } from './hypevm';
import { suivmAdapter } from './suivm';
import { svmAdapter } from './svm';
import { ChainAdapter } from './types';

const chainAdapters: Partial<Record<ChainType, ChainAdapter<any>>> = {
  [chainTypes.evm]: evmAdapter,
  [chainTypes.hypevm]: hypevmAdapter,
  [chainTypes.svm]: svmAdapter,
  [chainTypes.suivm]: suivmAdapter,
  [chainTypes.bvm]: bvmAdapter,
};

// the chain types of the chains the sdk knows by id, for when the chain config cannot be fetched
const knownChainTypes: Record<number, string> = {
  [exclusiveChainIds.hyperLiquid]: chainTypes.hypevm,
  [exclusiveChainIds.solana]: chainTypes.svm,
  [exclusiveChainIds.sui]: chainTypes.suivm,
  [exclusiveChainIds.btc]: chainTypes.bvm,
  [exclusiveChainIds.btcTestnet]: chainTypes.bvm,
  [exclusiveChainIds.btcln]: chainTypes.bvm,
};

/**
 * The chain type of a chain as the DZap API configures it, or as the sdk knows it by id when the config is not
 * there. Any other chain is taken to be evm.
 */
export const getChainType = (chainId: number, chainConfig?: ChainData | null): string =>
  chainConfig?.[chainId]?.chainType ?? knownChainTypes[chainId] ?? chainTypes.evm;

/**
 * The rpcs to use on a chain: the given ones, else those set with `DZapClient.getInstance`, else the ones the chain
 * config lists that need no key. Undefined when there are none, for the adapter to fall back to the chain's definition.
 */
export const getRpcUrls = (chainId: number, chainConfig?: ChainData | null, rpcUrls?: string[]): string[] | undefined => {
  if (rpcUrls?.length) return rpcUrls;
  const configured = config.getRpcUrlsByChainId(chainId);
  if (configured?.length) return configured;
  const publicRpcs = chainConfig?.[chainId]?.rpcProviders?.filter((rpc) => !rpc.keyRequired).map((rpc) => rpc.url);
  return publicRpcs?.length ? publicRpcs : undefined;
};

export const getChainAdapter = (chainType: string): ChainAdapter => {
  const adapter = chainAdapters[chainType as ChainType];
  if (!adapter) {
    throw new DZapTxnError(StatusCodes.InvalidRequest, `Transactions on ${chainType} chains are not supported`);
  }
  return adapter;
};

/**
 * The adapter of the chain type, checked to be able to use the signer.
 */
export const getChainAdapterFor = (chainType: string, signer: DZapSigner): ChainAdapter => {
  const adapter = getChainAdapter(chainType);
  if (!adapter.isSigner(signer)) {
    throw new DZapTxnError(StatusCodes.InvalidRequest, `The signer cannot sign ${chainType} transactions`);
  }
  return adapter;
};

export type { ChainAdapter } from './types';
