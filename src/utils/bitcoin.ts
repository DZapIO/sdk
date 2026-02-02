import type { ChainId } from '@bigmi/core';
import { ChainId as BigmiChainId } from '@bigmi/core';
import { payments, type Psbt } from 'bitcoinjs-lib';

import { chainIds } from '../constants';
import { ValidationError } from './baseError.js';

/**
 * Converts 33-byte compressed public key to 32-byte x-only format (required for Taproot P2TR).
 */
export const toXOnly = (pubKey: Uint8Array) => {
  if (pubKey.length === 32) return pubKey;
  if (pubKey.length === 33) return pubKey.subarray(1, 33);
  throw new ValidationError('Invalid public key length; expected 32 or 33 bytes');
};

/** Returns true if the PSBT is finalized and can be extracted to a transaction. */
export function isPsbtFinalized(psbt: Psbt): boolean {
  try {
    psbt.extractTransaction();
    return true;
  } catch {
    return false;
  }
}

/** Redeem script for P2SH-P2WPKH (P2WPKH output used as the redeem script). */
export const generateRedeemScript = (publicKey: Uint8Array) => payments.p2wpkh({ pubkey: publicKey }).output;

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
      throw new ValidationError(`Unsupported script type: ${scriptType}`);
  }
};

export const toBigmiChainId = (chainId: number): BigmiChainId => {
  switch (chainId) {
    case chainIds.bitcoin:
      return BigmiChainId.BITCOIN_MAINNET;
    case chainIds.bitcointestnet:
      return BigmiChainId.BITCOIN_TESTNET4;
    default:
      throw new ValidationError(
        `Unsupported Bitcoin chain ID: ${chainId}. Supported: ${chainIds.bitcoin} (mainnet), ${chainIds.bitcointestnet} (testnet).`,
      );
  }
};

export const bigmiToDzapChainId = (chainId: ChainId): number => {
  switch (chainId) {
    case BigmiChainId.BITCOIN_MAINNET:
      return chainIds.bitcoin;
    case BigmiChainId.BITCOIN_TESTNET4:
      return chainIds.bitcointestnet;
    default:
      throw new ValidationError(`Unsupported Bigmi chain ID: ${chainId}. Supported: BITCOIN_MAINNET, BITCOIN_TESTNET4.`);
  }
};
