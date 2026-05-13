import axios from 'axios';
import { ChainData } from '../../types';
import { AddressClassifyResult, AddressKind } from '../../types/address';
import { isNativeCurrency } from '../tokens';

const SUI_DEFAULT_RPC = 'https://fullnode.mainnet.sui.io';

const suiAccountRegex = /^0x[a-fA-F0-9]{1,64}$/;

// e.g. 0x2::sui::SUI or 0x...::module::COIN
const moveCoinTypeRegex = /^0x[a-fA-F0-9]{1,64}::[A-Za-z_][A-Za-z0-9_]*::[A-Za-z_][A-Za-z0-9_]*$/;

export async function classifySuivmAddress(params: {
  address: string;
  chainId: number;
  chainConfig: ChainData;
  rpcUrls?: string[];
}): Promise<AddressClassifyResult | null> {
  const { address, chainConfig, rpcUrls } = params;

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

  // On-chain: use sui_getObject to check if this address is a Move package (= contract)
  const rpcUrl = rpcUrls?.[0] ?? SUI_DEFAULT_RPC;
  try {
    const response = await axios.post(
      rpcUrl,
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'sui_getObject',
        params: [address, { showType: true }],
      },
      { validateStatus: (status) => status < 500 },
    );

    const result = response.data?.result;

    if (result?.data?.type === 'package' || result?.data?.dataType === 'package') {
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
    console.error(`RPC error (Sui sui_getObject): ${message}`);
    return null;
  }
}
