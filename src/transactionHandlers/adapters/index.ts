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

/**
 * The chain type of a chain as the DZap API configures it. Without the config, a chain is taken to be evm.
 */
export const resolveChainType = (chainId: number, chainConfig?: ChainData | null): string =>
  chainConfig?.[chainId]?.chainType ?? (chainId === exclusiveChainIds.hyperLiquid ? chainTypes.hypevm : chainTypes.evm);

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
