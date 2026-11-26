import axios from 'axios';
import { suiNativeToken } from '../../constants/address';

// Sui removed JSON-RPC from full nodes in v1.82; GraphQL is the remaining HTTP+JSON interface
export const SUI_GRAPHQL_URL = 'https://graphql.mainnet.sui.io/graphql';

export const querySuiGraphql = async <T>(query: string, variables: Record<string, unknown>): Promise<T | undefined> => {
  const response = await axios.post(SUI_GRAPHQL_URL, { query, variables });
  if (response.status !== 200 || response.data?.errors) {
    return undefined;
  }
  return response.data?.data as T | undefined;
};

const padCoinType = (coinType: string): string => {
  const parts = coinType.split('::');
  if (parts.length !== 3 || !parts[0].startsWith('0x')) return coinType;
  const address = parts[0].slice(2).toLowerCase();
  if (address.length > 64) return coinType;
  return `0x${address.padStart(64, '0')}::${parts[1]}::${parts[2]}`;
};

const suiNativePadded = padCoinType(suiNativeToken);

/**
 * Token lists keep the padded package address for every coin except SUI itself, which they spell
 * `0x2::sui::SUI` — and token matching downstream is an exact string comparison.
 */
export const toTokenListCoinType = (coinType: string): string => {
  const padded = padCoinType(coinType);
  return padded === suiNativePadded ? suiNativeToken : padded;
};
