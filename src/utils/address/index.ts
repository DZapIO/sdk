import { chainTypes } from '../../constants/chains';
import DZapClient from '../../dZapClient';
import { ChainData } from '../../types';
import { AddressClassifyResult } from '../../types/address';
import { classifyAptosvmAddress } from './aptosvm';
import { classifyBvmAddress } from './bvm';
import { classifyEvmAddress } from './evm';
import { classifySuivmAddress } from './suivm';
import { classifySvmAddress } from './svm';
import { classifyTonvmAddress } from './tonvm';
import { classifyTronvmAddress } from './tronvm';

type ResolvedChainType =
  | typeof chainTypes.evm
  | typeof chainTypes.svm
  | typeof chainTypes.bvm
  | typeof chainTypes.suivm
  | typeof chainTypes.aptosvm
  | typeof chainTypes.tonvm
  | typeof chainTypes.tronvm;

const classifiers: Record<
  ResolvedChainType,
  (params: { address: string; chainId: number; chainConfig: ChainData; rpcUrls?: string[] }) => Promise<AddressClassifyResult>
> = {
  [chainTypes.evm]: classifyEvmAddress,
  [chainTypes.svm]: classifySvmAddress,
  [chainTypes.bvm]: classifyBvmAddress,
  [chainTypes.suivm]: classifySuivmAddress,
  [chainTypes.aptosvm]: classifyAptosvmAddress,
  [chainTypes.tonvm]: classifyTonvmAddress,
  [chainTypes.tronvm]: classifyTronvmAddress,
};

const getChainType = (chainId: number, chainConfig: ChainData): ResolvedChainType | undefined => {
  const type = chainConfig[chainId]?.chainType;
  return type as ResolvedChainType | undefined;
};

export const classifyAddress = async (params: { address: string; chainId: number; rpcUrls?: string[] }): Promise<AddressClassifyResult> => {
  const chainConfig = await DZapClient.getChainConfig();
  const chainType = getChainType(params.chainId, chainConfig);
  if (!chainType) {
    throw new Error(`Chain type not found for chainId ${params.chainId}`);
  }
  const resolver = classifiers[chainType];
  if (!resolver) {
    throw new Error(`Resolver not found for chainType ${chainType}`);
  }
  return resolver({
    address: params.address,
    chainId: params.chainId,
    chainConfig,
    rpcUrls: params.rpcUrls,
  });
};
