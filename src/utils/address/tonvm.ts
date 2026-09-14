import axios from 'axios';
import { ChainData } from '../../types';
import { AddressClassifyResult, AddressKind } from '../../types/address';
import { isNativeCurrency } from '../tokens';

const TON_DEFAULT_RPC = 'https://toncenter.com/api/v2';

const TON_BOUNCEABLE_TAG = 0x11;
const TON_NON_BOUNCEABLE_TAG = 0x51;
const TON_TEST_ONLY_FLAG = 0x80;
const TON_MASTERCHAIN_BYTE = 0xff;

// `atob` is built into browsers and Node >= 16, so no base64 dependency is needed
const decodeBase64 = (value: string): Uint8Array => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

// CRC16-XMODEM, the checksum appended to TON user-friendly addresses
const crc16 = (data: Uint8Array): number => {
  let crc = 0;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i] << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc;
};

const isValidRawTonAddress = (address: string): boolean => {
  const parts = address.split(':');
  if (parts.length !== 2) return false;
  // No radix on purpose: tonweb parses the workchain this way, so "0x…" prefixes validate identically
  const workchain = parseInt(parts[0]);
  if (workchain !== 0 && workchain !== -1) return false;
  return /^[0-9a-fA-F]{64}$/.test(parts[1]);
};

const isValidFriendlyTonAddress = (address: string): boolean => {
  if (!/^[A-Za-z0-9+/_-]{48}$/.test(address)) return false;

  let bytes: Uint8Array;
  try {
    bytes = decodeBase64(address.replace(/-/g, '+').replace(/_/g, '/'));
  } catch {
    return false;
  }

  const body = bytes.slice(0, 34);
  const checksum = (bytes[34] << 8) | bytes[35];
  if (crc16(body) !== checksum) return false;

  const tag = body[0] & ~TON_TEST_ONLY_FLAG;
  if (tag !== TON_BOUNCEABLE_TAG && tag !== TON_NON_BOUNCEABLE_TAG) return false;

  return body[1] === 0 || body[1] === TON_MASTERCHAIN_BYTE;
};

/**
 * Validates a TON address in raw (`<workchain>:<hex>`) or user-friendly (48-char base64 / base64url) form.
 * Port of tonweb's `Address.isValid` so the SDK does not depend on tonweb.
 */
export const isValidTonAddress = (address: string): boolean => {
  if (typeof address !== 'string') return false;
  // tonweb only converts url-safe characters when '-' or '_' appears after the first character
  const normalized = address.search(/-/) > 0 || address.search(/_/) > 0 ? address.replace(/-/g, '+').replace(/_/g, '/') : address;
  return normalized.includes(':') ? isValidRawTonAddress(normalized) : isValidFriendlyTonAddress(normalized);
};

export async function classifyTonvmAddress(params: {
  address: string;
  chainId: number;
  chainConfig: ChainData;
  rpcUrls?: string[];
}): Promise<AddressClassifyResult | null> {
  const { address, chainConfig, rpcUrls } = params;

  if (!isValidTonAddress(address)) {
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

  const baseUrl = (rpcUrls?.[0] ?? TON_DEFAULT_RPC).replace(/\/$/, '');
  try {
    const infoResponse = await axios.get(`${baseUrl}/getAddressInformation`, {
      params: { address },
    });

    if (infoResponse.status !== 200 || infoResponse.data?.error || infoResponse.data?.ok === false) {
      return null;
    }

    const result = infoResponse.data?.result;

    if (!result?.code) {
      return {
        valid: true,
        kind: AddressKind.WALLET,
        isNative: false,
        isToken: false,
        isContract: false,
        address,
      };
    }

    // Contract detected — check if it is a Jetton master (fungible token)
    // by calling the mandatory get_jetton_data getter. exit_code 0 = success.
    try {
      const jettonResponse = await axios.post(
        `${baseUrl}/runGetMethod`,
        { address, method: 'get_jetton_data', stack: [] },
        { validateStatus: (status) => status < 500 },
      );
      if (jettonResponse.data?.result?.exit_code === 0) {
        return {
          valid: true,
          kind: AddressKind.TOKEN,
          isNative: false,
          isToken: true,
          isContract: true,
          address,
        };
      }
    } catch {
      // runGetMethod network error — fall through to CONTRACT
    }

    return {
      valid: true,
      kind: AddressKind.CONTRACT,
      isNative: false,
      isToken: false,
      isContract: true,
      address,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`RPC error (TON getAddressInformation): ${message}`);
    return null;
  }
}
