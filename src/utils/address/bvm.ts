import { ChainData } from '../../types';
import { AddressClassifyResult, AddressKind } from '../../types/address';
import { Network, validate as validateBitcoinAddress } from 'bitcoin-address-validation';
import { isNativeCurrency } from '../tokens';

export async function classifyBvmAddress(params: {
  address: string;
  chainId: number;
  chainConfig: ChainData;
  rpcUrls?: string[];
}): Promise<AddressClassifyResult> {
  const { address, chainId, chainConfig } = params;

  const chain = chainConfig[chainId];
  const isMainnet = chain?.mainnet ?? true;

  const isValidBtc = validateBitcoinAddress(address, isMainnet ? Network.mainnet : Network.testnet);
  if (!isValidBtc) {
    return {
      valid: false,
      kind: AddressKind.INVALID,
      isNative: false,
      isToken: false,
      isContract: false,
      address,
    };
  }

  if (isNativeCurrency(address, chainConfig)) {
    return {
      valid: true,
      kind: AddressKind.NATIVE,
      isNative: true,
      isToken: true,
      isContract: false,
      address,
    };
  }

  return {
    valid: true,
    kind: AddressKind.WALLET,
    isNative: false,
    isToken: false,
    isContract: false,
    address,
  };
}
