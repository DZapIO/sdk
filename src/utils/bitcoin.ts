import type { ChainId } from '@bigmi/core';
import { ChainId as BigmiChainId } from '@bigmi/core';
import { payments, type Psbt } from 'bitcoinjs-lib';

import { chainIds } from '../constants';

/**
 * Helper function to convert full public key (33 bytes) to x-only compressed format (32 bytes) required after taproot update
 * @param pubKey - full public key (33 bytes)
 * @returns x-only compressed public key (32 bytes)
 */
export const toXOnly = (pubKey: Uint8Array) => (pubKey.length === 32 ? pubKey : pubKey.subarray(1, 33));

/**
 * Checks if a PSBT is finalized and ready to extract
 * @param psbt - PSBT to check
 * @returns true if PSBT is finalized
 */
export function isPsbtFinalized(psbt: Psbt): boolean {
  try {
    psbt.extractTransaction();
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate redeem script for P2SH addresses
 * @param publicKey - Public key bytes
 * @returns redeem script
 */
export const generateRedeemScript = (publicKey: Uint8Array) =>
  // P2SH addresses are created by hashing the public key and using the result as the script
  payments.p2wpkh({ pubkey: publicKey }).output;

export const getScriptPubKey = (pubKeyHex: string, scriptType: string) => {
  const pubKey = new Uint8Array(Buffer.from(pubKeyHex, 'hex'));

  switch (scriptType) {
    case 'p2pkh':
      return payments.p2pkh({ pubkey: pubKey }).output;
    case 'p2wpkh':
      return payments.p2wpkh({ pubkey: pubKey }).output;
    case 'p2wsh':
      return payments.p2wsh({ pubkey: pubKey }).output;
    case 'p2sh':
      return payments.p2sh({
        redeem: payments.p2wpkh({ pubkey: pubKey }),
      }).output;
    case 'p2tr':
      return payments.p2tr({
        internalPubkey: toXOnly(pubKey),
      }).output;
    default:
      throw new Error(`Unsupported script type: ${scriptType}`);
  }
};

export const toBigmiChainId = (chainId: number): BigmiChainId => {
  switch (chainId) {
    case chainIds.bitcointestnet:
      return BigmiChainId.BITCOIN_TESTNET4;
    default:
      return BigmiChainId.BITCOIN_MAINNET;
  }
};

export const bigmiToDzapChainId = (chainId: ChainId): number => {
  switch (chainId) {
    case BigmiChainId.BITCOIN_TESTNET4:
      return chainIds.bitcointestnet;
    default:
      return chainIds.bitcoin;
  }
};
