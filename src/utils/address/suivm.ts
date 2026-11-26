import { ChainData } from '../../types';
import { AddressClassifyResult, AddressKind } from '../../types/address';
import { querySuiGraphql } from '../sui/graphql';
import { isNativeCurrency } from '../tokens';

const PACKAGE_QUERY = `query ($address: SuiAddress!) {
  package(address: $address) { address }
}`;

const suiAccountRegex = /^0x[a-fA-F0-9]{1,64}$/;

// e.g. 0x2::sui::SUI or 0x...::module::COIN
const moveCoinTypeRegex = /^0x[a-fA-F0-9]{1,64}::[A-Za-z_][A-Za-z0-9_]*::[A-Za-z_][A-Za-z0-9_]*$/;

export async function classifySuivmAddress(params: {
  address: string;
  chainId: number;
  chainConfig: ChainData;
  rpcUrls?: string[];
}): Promise<AddressClassifyResult | null> {
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

  // Move coin type string (e.g. 0x2::sui::SUI) is always a token
  if (moveCoinTypeRegex.test(address)) {
    return {
      valid: true,
      kind: AddressKind.TOKEN,
      isNative: false,
      isToken: true,
      isContract: true,
      address,
    };
  }

  if (!suiAccountRegex.test(address)) {
    return {
      valid: false,
      kind: AddressKind.INVALID,
      isNative: false,
      isToken: false,
      isContract: false,
      address,
    };
  }

  // On-chain: a Move package resolves under `package`, a plain account does not
  try {
    const data = await querySuiGraphql<{ package: { address: string } | null }>(PACKAGE_QUERY, { address });

    if (data === undefined) {
      return null;
    }

    if (data.package) {
      return {
        valid: true,
        kind: AddressKind.CONTRACT,
        isNative: false,
        isToken: false,
        isContract: true,
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
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`RPC error (Sui package lookup): ${message}`);
    return null;
  }
}
