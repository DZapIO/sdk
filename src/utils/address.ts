import { getAddress, isAddress, zeroAddress } from 'viem';

import { DZAP_NATIVE_TOKEN_FORMAT } from '../constants';
import { NATIVE_TOKENS } from '../constants/tokens';
import type { Chain, HexString } from '../types';

export function isNativeCurrency(contract: string, chain: Chain): boolean {
  return chain.nativeToken.contract === contract;
}

const isNativeAddress = (contract: string) => NATIVE_TOKENS.includes(contract);

export const getChecksumAddress = (address: string): HexString => getAddress(address);

export const formatToken = <T extends HexString | string = string>(token: T, nativeTokenAddress: T = zeroAddress as T): T => {
  if (!isAddress(token)) {
    return token;
  } else if (isNativeAddress(token)) {
    return nativeTokenAddress;
  } else {
    return getChecksumAddress(token) as T;
  }
};

/**
 * Checks if a swap operation is one-to-many (same source token for multiple destinations)
 * @param firstTokenAddress - First token address
 * @param secondTokenAddress - Second token address
 * @returns True if addresses are the same
 */
export const isOneToMany = (firstTokenAddress: string, secondTokenAddress: string) => firstTokenAddress === secondTokenAddress;

/**
 * Checks if a token address is the DZap native token format
 * @param srcToken - Token address to check
 * @returns True if the token is in native format
 */
export const isDZapNativeToken = (srcToken: string) => srcToken === DZAP_NATIVE_TOKEN_FORMAT;
