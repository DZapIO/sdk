/**
 * Integration tests for the BVM (Bitcoin) address classifier.
 * Bitcoin classification is format-only (no on-chain I/O).
 *
 * Bitcoin has no contract or token concept, so WALLET is the only valid kind.
 * Multiple script-types are tested: P2PKH, P2SH, bech32 (P2WPKH).
 */

import { DZapClient } from '../../src';
import { exclusiveChainIds } from '../../src/constants/chains';
import { ChainData } from '../../src/types';
import { AddressKind } from '../../src/types/address';
import { classifyBvmAddress } from '../../src/utils/address/bvm';

jest.setTimeout(30_000);

const CHAIN_ID = exclusiveChainIds.btc;

let chainConfig: ChainData;

beforeAll(async () => {
  chainConfig = await DZapClient.getChainConfig();
});

describe('BVM classifier (Bitcoin — format validation only)', () => {
  it('classifies a P2PKH address as WALLET', async () => {
    const result = await classifyBvmAddress({
      address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Bitcoin genesis address
      chainId: CHAIN_ID,
      chainConfig,
    });
    expect(result.kind).toBe(AddressKind.WALLET);
    expect(result.valid).toBe(true);
  });

  it('classifies a P2SH address as WALLET', async () => {
    const result = await classifyBvmAddress({
      address: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
      chainId: CHAIN_ID,
      chainConfig,
    });
    expect(result.kind).toBe(AddressKind.WALLET);
    expect(result.valid).toBe(true);
  });

  it('classifies a bech32 (P2WPKH) address as WALLET', async () => {
    const result = await classifyBvmAddress({
      address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      chainId: CHAIN_ID,
      chainConfig,
    });
    expect(result.kind).toBe(AddressKind.WALLET);
    expect(result.valid).toBe(true);
  });

  it('returns INVALID for a non-Bitcoin string', async () => {
    const result = await classifyBvmAddress({
      address: 'not-a-bitcoin-address',
      chainId: CHAIN_ID,
      chainConfig,
    });
    expect(result.kind).toBe(AddressKind.INVALID);
    expect(result.valid).toBe(false);
  });
});
