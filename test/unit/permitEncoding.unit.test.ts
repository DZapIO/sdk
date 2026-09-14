import { ethers } from 'ethers';
import { parseSignature, encodeAbiParameters, parseAbiParameters } from 'viem';
import { HexString } from '../../src/types';

/**
 * Equivalence tests for replacing ethers' signature and ABI-encoding helpers
 * with viem's, so that `ethers` can be dropped as a runtime dependency.
 *
 * These run against BOTH implementations and assert byte-identical output.
 * They exist because the permit encoding they cover is consumed on-chain: a
 * silent divergence here does not throw, it produces a signature the contract
 * rejects — or worse, accepts against different parameters than intended.
 *
 * The specific hazard checked is `v`: ethers' splitSignature reports the
 * recovery id as 27/28, while viem's parseSignature also exposes `yParity`
 * (0/1). Encoding yParity where a contract expects v yields an invalid
 * signature.
 */

const R = '0x' + '11'.repeat(32);
const S = '22'.repeat(32);
const SIG_V27 = (R + S + '1b') as HexString;
const SIG_V28 = (R + S + '1c') as HexString;

const DEADLINE = 1893456000;
const ACCOUNT = ('0x' + 'ab'.repeat(20)) as HexString;
const SPENDER = ('0x' + 'cd'.repeat(20)) as HexString;
const AMOUNT = '1000000';

describe('signature splitting: ethers vs viem', () => {
  it.each([
    ['v=27', SIG_V27, 27],
    ['v=28', SIG_V28, 28],
  ])('%s — r, s and v agree', (_label, sig, expectedV) => {
    const e = ethers.utils.splitSignature(sig);
    const v = parseSignature(sig as `0x${string}`);

    expect(v.r.toLowerCase()).toBe(e.r.toLowerCase());
    expect(v.s.toLowerCase()).toBe(e.s.toLowerCase());
    expect(Number(v.v)).toBe(e.v);
    expect(Number(v.v)).toBe(expectedV);
  });

  it('viem yParity is NOT interchangeable with v', () => {
    const v = parseSignature(SIG_V28 as `0x${string}`);

    // 28 vs 1 — encoding yParity where v is expected produces an invalid
    // signature that no contract will recover to the right address.
    expect(Number(v.v)).not.toBe(v.yParity);
  });
});

describe('permit ABI encoding: ethers vs viem', () => {
  const e = ethers.utils.splitSignature(SIG_V28);

  it('short form (v2 / zap) is byte-identical', () => {
    const fromEthers = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint8', 'bytes32', 'bytes32'], [DEADLINE, e.v, e.r, e.s]);

    const fromViem = encodeAbiParameters(parseAbiParameters('uint256, uint8, bytes32, bytes32'), [
      BigInt(DEADLINE),
      e.v,
      e.r as HexString,
      e.s as HexString,
    ]);

    expect(fromViem).toBe(fromEthers);
  });

  it('long form (v1 non-zap) is byte-identical', () => {
    const fromEthers = ethers.utils.defaultAbiCoder.encode(
      ['address', 'address', 'uint256', 'uint256', 'uint8', 'bytes32', 'bytes32'],
      [ACCOUNT, SPENDER, AMOUNT, DEADLINE, e.v, e.r, e.s],
    );

    const fromViem = encodeAbiParameters(parseAbiParameters('address, address, uint256, uint256, uint8, bytes32, bytes32'), [
      ACCOUNT,
      SPENDER,
      BigInt(AMOUNT),
      BigInt(DEADLINE),
      e.v,
      e.r as HexString,
      e.s as HexString,
    ]);

    expect(fromViem).toBe(fromEthers);
  });

  it('encodes maxUint256 amounts identically', () => {
    const max = (2n ** 256n - 1n).toString();

    const fromEthers = ethers.utils.defaultAbiCoder.encode(['uint256'], [max]);
    const fromViem = encodeAbiParameters(parseAbiParameters('uint256'), [BigInt(max)]);

    expect(fromViem).toBe(fromEthers);
  });
});
