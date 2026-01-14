import { zeroAddress } from 'viem';

import { formatToken } from './address';

/**
 * Generates a unique key for a token pair across chains
 * @param srcToken - Source token address
 * @param destToken - Destination token address
 * @param srcChainId - Source chain ID
 * @param destChainId - Destination chain ID
 * @param srcChainNativeAddress - Native token address on source chain (defaults to zero address)
 * @param destChainNativeAddress - Native token address on destination chain (defaults to zero address)
 * @returns A unique string key in format: srcChainId_srcToken-destChainId_destToken
 */
export function getTokensPairKey({
  srcToken,
  destToken,
  srcChainId,
  destChainId,
  srcChainNativeAddress = zeroAddress,
  destChainNativeAddress = zeroAddress,
}: {
  srcToken: string;
  destToken: string;
  srcChainId: number;
  destChainId: number;
  srcChainNativeAddress?: string;
  destChainNativeAddress?: string;
}): string {
  const srcFormattedAddress = formatToken(srcToken, srcChainNativeAddress);
  const destFormattedAddress = formatToken(destToken, destChainNativeAddress);
  return `${srcChainId}_${srcFormattedAddress}-${destChainId}_${destFormattedAddress}`;
}
