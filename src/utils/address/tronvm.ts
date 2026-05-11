import { ChainData } from '../../types';
import { AddressClassifyResult, AddressKind } from '../../types/address';
import { isNativeCurrency } from '../tokens';

const tronAddressRegex = /^T[A-Za-z1-9]{33}$/;

export async function classifyTronvmAddress(params: {
  address: string;
  chainId: number;
  chainConfig: ChainData;
  rpcUrls?: string[];
}): Promise<AddressClassifyResult> {
  const { address, chainConfig } = params;

  if (!tronAddressRegex.test(address)) {
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
    kind: AddressKind.EOA,
    isNative: false,
    isToken: false,
    isContract: false,
    address,
  };
}
