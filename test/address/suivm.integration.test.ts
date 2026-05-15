/**
 * Integration tests for the Sui address classifier.
 * Makes REAL sui_getObject calls to Sui mainnet.
 *
 * Addresses used:
 *   TOKEN    — Circle USDC Move coin type (format-only, no RPC call)
 *   CONTRACT — 0x2 Sui framework package (type: 'package')
 *   WALLET   — unused address (no object found → WALLET)
 */

import { DZapClient } from '../../src';
import { classifySuivmAddress } from '../../src/utils/address/suivm';
import { ChainData } from '../../src/types';
import { AddressKind } from '../../src/types/address';
import { exclusiveChainIds } from '../../src/constants/chains';

jest.setTimeout(30_000);

const CHAIN_ID = exclusiveChainIds.sui;
const RPC = ['https://fullnode.mainnet.sui.io'];

let chainConfig: ChainData;

beforeAll(async () => {
  chainConfig = await DZapClient.getChainConfig();
});

describe('Sui classifier (live — Sui mainnet)', () => {
  it('classifies a Move coin type string as TOKEN', async () => {
    const result = await classifySuivmAddress({
      // Circle USDC on Sui — coin type format, no RPC call needed
      address: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
      chainId: CHAIN_ID,
      chainConfig,
      rpcUrls: RPC,
    });
    expect(result?.kind).toBe(AddressKind.TOKEN);
    expect(result?.isToken).toBe(true);
  });

  it('classifies Sui framework package (0x2) as CONTRACT', async () => {
    const result = await classifySuivmAddress({
      // sui_getObject returns type: 'package' for 0x2
      address: '0x2',
      chainId: CHAIN_ID,
      chainConfig,
      rpcUrls: RPC,
    });
    expect(result?.kind).toBe(AddressKind.CONTRACT);
    expect(result?.isContract).toBe(true);
  });

  it('classifies an unused address as WALLET', async () => {
    const result = await classifySuivmAddress({
      address: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      chainId: CHAIN_ID,
      chainConfig,
      rpcUrls: RPC,
    });
    expect(result?.kind).toBe(AddressKind.WALLET);
    expect(result?.isContract).toBe(false);
  });
});
