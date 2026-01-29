import { payments, type Psbt } from 'bitcoinjs-lib';

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
