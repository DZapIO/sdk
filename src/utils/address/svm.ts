import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import { ChainData } from '../../types';
import { AddressClassifyResult, AddressKind } from '../../types/address';
import { isNativeCurrency } from '../tokens';

const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';

export function parseSvmAddress(address: string): PublicKey | null {
  try {
    return new PublicKey(address);
  } catch {
    return null;
  }
}

function svmTokenProgramOwner(owner: string): boolean {
  return owner === TOKEN_PROGRAM_ID || owner === TOKEN_2022_PROGRAM_ID;
}

export async function classifySvmAddress(params: {
  address: string;
  chainId: number;
  chainConfig: ChainData;
  rpcUrls?: string[];
}): Promise<AddressClassifyResult | null> {
  const { address, rpcUrls, chainConfig } = params;
  const pubkey = parseSvmAddress(address);
  if (!pubkey) {
    return {
      valid: false,
      kind: AddressKind.INVALID,
      isNative: false,
      isToken: false,
      isContract: false,
      address,
    };
  }

  const normalized = pubkey.toBase58();

  if (isNativeCurrency(normalized, chainConfig)) {
    return {
      valid: true,
      kind: AddressKind.NATIVE,
      isNative: true,
      isToken: true,
      isContract: false,
      address: normalized,
    };
  }

  const connection = new Connection(rpcUrls?.[0] || clusterApiUrl('mainnet-beta'));

  let parsed: Awaited<ReturnType<Connection['getParsedAccountInfo']>>;
  try {
    parsed = await connection.getParsedAccountInfo(pubkey);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`RPC error (getParsedAccountInfo): ${message}`);
    return null;
  }

  const value = parsed.value;
  if (!value) {
    return {
      valid: true,
      kind: AddressKind.WALLET,
      isNative: false,
      isToken: false,
      isContract: false,
      address: normalized,
    };
  }

  if (value.executable) {
    return {
      valid: true,
      kind: AddressKind.CONTRACT,
      isNative: false,
      isToken: false,
      isContract: true,
      address: normalized,
    };
  }

  const owner = value.owner.toBase58();
  const data = value.data;
  if (typeof data === 'object' && data !== null && 'parsed' in data) {
    const rawParsed = (data as { parsed: unknown }).parsed;
    const innerType =
      rawParsed && typeof rawParsed === 'object' && rawParsed !== null && 'type' in rawParsed
        ? String((rawParsed as { type: string }).type)
        : undefined;

    if (svmTokenProgramOwner(owner) && innerType === 'mint') {
      return {
        valid: true,
        kind: AddressKind.TOKEN,
        isNative: false,
        isToken: true,
        isContract: true,
        address: normalized,
      };
    }

    if (svmTokenProgramOwner(owner) && innerType === 'account') {
      return {
        valid: true,
        kind: AddressKind.CONTRACT,
        isNative: false,
        isToken: false,
        isContract: true,
        address: normalized,
      };
    }
  }

  return {
    valid: true,
    kind: AddressKind.WALLET,
    isNative: false,
    isToken: false,
    isContract: false,
    address: normalized,
  };
}
