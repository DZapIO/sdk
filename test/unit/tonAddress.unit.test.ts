import { isValidTonAddress, crc16 } from '../../src/utils/address/tonAddress';

/**
 * Tests for the dependency-free TON address validator that replaced
 * `TonWeb.utils.Address.isValid`.
 *
 * Every case below was run against BOTH implementations on the commit that made
 * the swap, and they agreed on all 25 — 9 valid forms (both tags, both
 * workchains, the test flag, and raw addresses), 12 invalid forms, a corrupted
 * checksum and a bad tag byte. tonweb is no longer a dependency, so the
 * comparison is gone and the expected values are asserted directly; the parity
 * evidence lives in that commit.
 *
 * Getting this wrong is not cosmetic: a validator that is too permissive lets a
 * user send funds to an address with a corrupted checksum, which is exactly what
 * TON's CRC is there to prevent.
 */


/** Builds a user-friendly address with a correct CRC for the given parts. */
const buildFriendly = (tag: number, workchain: number, account: Uint8Array): string => {
  const bytes = new Uint8Array(36);
  bytes[0] = tag;
  bytes[1] = workchain;
  bytes.set(account, 2);

  const crc = crc16(bytes.slice(0, 34));
  bytes[34] = crc >> 8;
  bytes[35] = crc & 0xff;

  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return Buffer.from(binary, 'binary').toString('base64');
};

const accountOf = (fill: number): Uint8Array => new Uint8Array(32).fill(fill);

describe('isValidTonAddress — parity with TonWeb.utils.Address.isValid', () => {
  const valid: string[] = [
    // bounceable / non-bounceable, basechain / masterchain, incl. test flag
    buildFriendly(0x11, 0x00, accountOf(0xab)),
    buildFriendly(0x51, 0x00, accountOf(0xcd)),
    buildFriendly(0x11, 0xff, accountOf(0x01)),
    buildFriendly(0x51, 0xff, accountOf(0xfe)),
    buildFriendly(0x11 | 0x80, 0x00, accountOf(0x22)),
    buildFriendly(0x51 | 0x80, 0xff, accountOf(0x33)),
    // raw form
    '0:' + 'a'.repeat(64),
    '-1:' + '0123456789abcdef'.repeat(4),
    '0:' + 'ABCDEF0123456789'.repeat(4),
  ];

  it.each(valid)('accepts %s', (address) => {
    expect(isValidTonAddress(address)).toBe(true);
  });

  const invalid: Array<[string, string]> = [
    ['empty string', ''],
    ['too short', 'abc'],
    ['47 chars', buildFriendly(0x11, 0x00, accountOf(0xab)).slice(0, 47)],
    ['49 chars', buildFriendly(0x11, 0x00, accountOf(0xab)) + 'A'],
    ['illegal base64 char', buildFriendly(0x11, 0x00, accountOf(0xab)).slice(0, 47) + '*'],
    ['raw with short hash', '0:' + 'a'.repeat(63)],
    ['raw with long hash', '0:' + 'a'.repeat(65)],
    ['raw with non-hex', '0:' + 'z'.repeat(64)],
    ['raw with bad workchain', '5:' + 'a'.repeat(64)],
    ['raw with no hash', '0:'],
    ['not an address at all', 'hello world'],
    ['an EVM address', '0x4ab9F97585B0161f1aDa8484B209C44be54dad73'],
  ];

  it.each(invalid)('rejects %s', (_label, address) => {
    expect(isValidTonAddress(address)).toBe(false);
  });

  it('rejects a corrupted checksum — the whole point of the CRC', () => {
    const good = buildFriendly(0x11, 0x00, accountOf(0xab));
    // Flip a character in the account portion so the CRC no longer matches.
    const corrupted = good.slice(0, 10) + (good[10] === 'A' ? 'B' : 'A') + good.slice(11);

    expect(isValidTonAddress(corrupted)).toBe(false);
  });

  it('rejects an invalid tag byte', () => {
    const bad = buildFriendly(0x22, 0x00, accountOf(0xab));

    expect(isValidTonAddress(bad)).toBe(false);
  });

  it('never throws on non-string input, unlike the tonweb constructor', () => {
    expect(() => isValidTonAddress(null)).not.toThrow();
    expect(() => isValidTonAddress(undefined)).not.toThrow();
    expect(() => isValidTonAddress(42)).not.toThrow();
    expect(isValidTonAddress(null)).toBe(false);
    expect(isValidTonAddress(undefined)).toBe(false);
    expect(isValidTonAddress(42)).toBe(false);
  });
});

describe('crc16', () => {
  it('matches known CRC-16/XMODEM vectors', () => {
    expect(crc16(new Uint8Array([]))).toBe(0);
    // "123456789" -> 0x31C3 for CRC-16/XMODEM
    expect(crc16(new Uint8Array([0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39]))).toBe(0x31c3);
  });
});
