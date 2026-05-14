import axios from 'axios';
import { ChainData } from '../../types';
import { AddressClassifyResult, AddressKind } from '../../types/address';
import { isNativeCurrency } from '../tokens';

const TRON_DEFAULT_RPC = 'https://api.trongrid.io';

const tronAddressRegex = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

export async function classifyTronvmAddress(params: {
  address: string;
  chainId: number;
  chainConfig: ChainData;
  rpcUrls?: string[];
}): Promise<AddressClassifyResult | null> {
  const { address, chainConfig, rpcUrls } = params;

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

  // On-chain: /wallet/getcontract returns contract details if deployed, empty object for EOA
  const baseUrl = (rpcUrls?.[0] ?? TRON_DEFAULT_RPC).replace(/\/$/, '');
  try {
    const response = await axios.post(`${baseUrl}/wallet/getcontract`, { value: address, visible: true });

    if (response.status !== 200 || response.data?.error) {
      return null;
    }
    const contract = response.data;
    const hasBytecode = contract?.bytecode && String(contract.bytecode).length > 0;

    if (!hasBytecode) {
      return {
        valid: true,
        kind: AddressKind.WALLET,
        isNative: false,
        isToken: false,
        isContract: false,
        address,
      };
    }

    // Heuristic: TRC-20 contracts expose a 'decimals' function in their ABI
    const abiEntries: Array<{ name?: string }> = contract?.abi?.entrys ?? [];
    const isToken = abiEntries.some((entry) => entry.name === 'decimals');

    return {
      valid: true,
      kind: isToken ? AddressKind.TOKEN : AddressKind.CONTRACT,
      isNative: false,
      isToken,
      isContract: true,
      address,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`RPC error (Tron getcontract): ${message}`);
    return null;
  }
}
