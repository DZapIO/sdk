/**
 * Dependency-free TON address validation.
 *
 * This replaces `TonWeb.utils.Address.isValid`, which was the *only* thing the
 * SDK used `tonweb` for. That single call cost 558 of the package's 671
 * transitive dependencies — including the entire React Native, Expo and Metro
 * toolchains, via tonweb -> isomorphic-webcrypto and
 * tonweb -> @ledgerhq/hw-transport-* — in a package that signs transactions in
 * browsers and on servers.
 *
 * Two address forms are accepted, matching tonweb's own parser:
 *
 *  - raw:           `<workchain>:<64 hex chars>`, workchain 0 or -1
 *  - user-friendly: 48 base64 chars (standard or URL-safe) decoding to 36
 *                   bytes: tag(1) | workchain(1) | account(32) | crc16(2)
 *
 * The checksum is CRC-16/XMODEM (polynomial 0x1021, zero init, no reflection),
 * computed over the first 34 bytes.
 */

const BOUNCEABLE_TAG = 0x11;
const NON_BOUNCEABLE_TAG = 0x51;
const TEST_FLAG = 0x80;

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * CRC-16/XMODEM over `data`, computed bit by bit with two zero bytes appended.
 * This mirrors tonweb's implementation so the accept/reject boundary is
 * identical rather than merely similar.
 */
export const crc16 = (data: Uint8Array): number => {
  const poly = 0x1021;
  let reg = 0;
  const message = new Uint8Array(data.length + 2);
  message.set(data);

  for (let i = 0; i < message.length; i++) {
    let mask = 0x80;
    while (mask > 0) {
      reg <<= 1;
      if (message[i] & mask) reg += 1;
      mask >>= 1;
      if (reg > 0xffff) {
        reg &= 0xffff;
        reg ^= poly;
      }
    }
  }

  return reg;
};

/**
 * Decodes standard or URL-safe base64 without depending on Buffer or atob, so
 * the same code path runs in Node and in the browser.
 */
const decodeBase64 = (input: string): Uint8Array | null => {
  const normalised = input.replace(/-/g, '+').replace(/_/g, '/');
  if (normalised.length % 4 !== 0) return null;

  const out: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (let i = 0; i < normalised.length; i++) {
    const char = normalised[i];
    if (char === '=') break;

    const value = BASE64_ALPHABET.indexOf(char);
    if (value === -1) return null;

    buffer = (buffer << 6) | value;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      out.push((buffer >> bits) & 0xff);
    }
  }

  return new Uint8Array(out);
};

const isValidRawAddress = (address: string): boolean => {
  const separator = address.indexOf(':');
  if (separator === -1) return false;

  const workchain = address.slice(0, separator);
  const hash = address.slice(separator + 1);

  if (workchain !== '0' && workchain !== '-1') return false;
  if (hash.length !== 64) return false;

  return /^[0-9a-fA-F]{64}$/.test(hash);
};

const isValidUserFriendlyAddress = (address: string): boolean => {
  if (address.length !== 48) return false;
  // Reject anything outside both base64 alphabets before decoding.
  if (!/^[A-Za-z0-9+/\-_]{48}$/.test(address)) return false;

  const bytes = decodeBase64(address);
  if (!bytes || bytes.length !== 36) return false;

  let tag = bytes[0];
  if (tag & TEST_FLAG) tag ^= TEST_FLAG;
  if (tag !== BOUNCEABLE_TAG && tag !== NON_BOUNCEABLE_TAG) return false;

  const workchain = bytes[1] === 0xff ? -1 : bytes[1];
  if (workchain !== 0 && workchain !== -1) return false;

  const expected = (bytes[34] << 8) | bytes[35];
  return crc16(bytes.slice(0, 34)) === expected;
};

/**
 * Returns true when `address` is a valid TON address in either supported form.
 * Never throws — tonweb signalled invalidity by throwing from its constructor,
 * which callers had to wrap; this returns a boolean directly.
 */
export const isValidTonAddress = (address: unknown): boolean => {
  if (typeof address !== 'string') return false;
  if (address.length === 0) return false;

  return address.includes(':') ? isValidRawAddress(address) : isValidUserFriendlyAddress(address);
};
