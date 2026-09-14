import { Wallet } from 'ethers';
import { isTypeSigner } from '../../src/utils';

/**
 * `isTypeSigner` uses `variable instanceof Signer` and is the discriminator
 * that branches between the ethers and viem code paths in 7 call sites.
 *
 * `instanceof` compares constructor identity, so it returns false for a valid
 * signer that came from a *different copy* of ethers — and duplicate copies
 * are already proven in the consumer dependency tree. These tests pin the
 * current behaviour, including the failure mode, before it is changed.
 */

// Well-known public test key (hardhat account #0). Never used for real funds.
const TEST_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

describe('isTypeSigner', () => {
  it('recognises a real ethers signer', () => {
    expect(isTypeSigner(new Wallet(TEST_KEY))).toBe(true);
  });

  it('rejects a viem-style wallet client', () => {
    const walletClient = {
      account: { address: '0x0000000000000000000000000000000000000001' },
      signTypedData: async () => '0x',
      sendTransaction: async () => '0x',
    };

    expect(isTypeSigner(walletClient)).toBe(false);
  });

  it('rejects null, undefined and primitives without throwing', () => {
    expect(isTypeSigner(null)).toBe(false);
    expect(isTypeSigner(undefined)).toBe(false);
    expect(isTypeSigner('0xabc')).toBe(false);
    expect(isTypeSigner(42)).toBe(false);
  });

  it('DOCUMENTS THE HAZARD: a structurally valid signer from another ethers copy is not recognised', () => {
    // Shape-identical to an ethers v5 Signer, but not constructed from the
    // same class object — exactly what happens when a consumer's bundler
    // resolves a second copy of ethers.
    const foreignSigner = {
      _signTypedData: async () => '0x',
      signMessage: async () => '0x',
      sendTransaction: async () => ({ hash: '0x' }),
      getAddress: async () => '0x0000000000000000000000000000000000000001',
      provider: {},
      _isSigner: true,
    };

    // Current behaviour. If this ever starts returning true, the duck-typing
    // migration has landed and this expectation should flip.
    expect(isTypeSigner(foreignSigner)).toBe(false);
  });
});
