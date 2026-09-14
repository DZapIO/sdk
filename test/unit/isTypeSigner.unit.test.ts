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

  it('recognises a structurally valid signer from another ethers copy', () => {
    // Shape-identical to an ethers v5 Signer, but not constructed from the
    // same class object — exactly what happens when a consumer's bundler
    // resolves a second copy of ethers.
    //
    // This expectation was deliberately flipped from false to true when the
    // duck-typing migration landed. Under the old `instanceof Signer` check
    // this returned false and silently routed a valid signer down the viem
    // branch; see D6 in docs/SDK_HARDENING_REFERENCE.md.
    const foreignSigner = {
      _signTypedData: async () => '0x',
      signMessage: async () => '0x',
      sendTransaction: async () => ({ hash: '0x' }),
      getAddress: async () => '0x0000000000000000000000000000000000000001',
      provider: {},
      _isSigner: true,
    };

    expect(isTypeSigner(foreignSigner)).toBe(true);
  });

  it('recognises a signer by structure even without the _isSigner marker', () => {
    const structural = {
      _signTypedData: async () => '0x',
      getAddress: async () => '0x0000000000000000000000000000000000000001',
    };

    expect(isTypeSigner(structural)).toBe(true);
  });

  it('rejects an object that merely has getAddress', () => {
    // Guards against over-matching: many objects expose getAddress.
    expect(isTypeSigner({ getAddress: async () => '0x' })).toBe(false);
  });
});
