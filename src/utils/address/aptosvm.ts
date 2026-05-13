import axios from 'axios';
import { ChainData } from '../../types';
import { AddressClassifyResult, AddressKind } from '../../types/address';
import { isNativeCurrency } from '../tokens';

const APTOS_DEFAULT_RPC = 'https://fullnode.mainnet.aptoslabs.com';

const aptosAccountRegex = /^0x[a-fA-F0-9]{1,64}$/;
const moveCoinTypeRegex = /^0x[a-fA-F0-9]{1,64}::[A-Za-z_][A-Za-z0-9_]*::[A-Za-z_][A-Za-z0-9_]*$/;

export async function classifyAptosvmAddress(params: {
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

  // Move coin type string (e.g. 0x1::aptos_coin::AptosCoin) is always a token
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

  if (!aptosAccountRegex.test(address)) {
    return {
      valid: false,
      kind: AddressKind.INVALID,
      isNative: false,
      isToken: false,
      isContract: false,
      address,
    };
  }

  // On-chain: check if account has published Move modules (= smart contract)
  const baseUrl = (rpcUrls?.[0] ?? APTOS_DEFAULT_RPC).replace(/\/$/, '');
  try {
    const response = await axios.get(`${baseUrl}/v1/accounts/${address}/modules`, {
      params: { limit: 1 },
      validateStatus: (status) => status < 500,
    });

    if (response.status === 200) {
      const modules = response.data;
      if (Array.isArray(modules) && modules.length > 0) {
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
    }

    // 404 = account not found on-chain (not yet funded/created) → treat as EOA
    if (response.status === 404) {
      return {
        valid: true,
        kind: AddressKind.WALLET,
        isNative: false,
        isToken: false,
        isContract: false,
        address,
      };
    }

    return null;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`RPC error (Aptos getModules): ${message}`);
    return null;
  }
}
