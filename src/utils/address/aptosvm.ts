import { ChainData } from '../../types';
import { AddressClassifyResult, AddressKind } from '../../types/address';
import { isNativeCurrency } from '../tokens';

const aptosAccountRegex = /^0x[a-fA-F0-9]{1,64}$/;
const moveCoinTypeRegex = /^0x[a-fA-F0-9]{1,64}::[A-Za-z_][A-Za-z0-9_]*::[A-Za-z_][A-Za-z0-9_]*$/;

export async function classifyAptosvmAddress(params: {
  address: string;
  chainId: number;
  chainConfig: ChainData;
  rpcUrls?: string[];
}): Promise<AddressClassifyResult> {
  const { address, chainConfig } = params;

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

  if (moveCoinTypeRegex.test(address)) {
    return {
      valid: true,
      kind: AddressKind.TOKEN,
      isNative: false,
      isToken: true,
      isContract: false,
      address,
    };
  }

  if (aptosAccountRegex.test(address)) {
    return {
      valid: true,
      kind: AddressKind.EOA,
      isNative: false,
      isToken: false,
      isContract: false,
      address,
    };
  }

  return {
    valid: false,
    kind: AddressKind.INVALID,
    isNative: false,
    isToken: false,
    isContract: false,
    address,
  };
}
