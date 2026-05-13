/**
 * Integration tests for the Aptos address classifier.
 * Makes REAL calls to the Aptos mainnet REST API.
 *
 * Addresses used:
 *   TOKEN    — LayerZero USDC Move coin type (format-only, no RPC call)
 *   CONTRACT — 0x1 Aptos framework (has published Move modules)
 *   WALLET   — unused account address (404 / no modules → WALLET)
 */

import { DZapClient } from '../../src';
import { classifyAptosvmAddress } from '../../src/utils/address/aptosvm';
import { ChainData } from '../../src/types';
import { AddressKind } from '../../src/types/address';
import { exclusiveChainIds } from '../../src/constants/chains';

jest.setTimeout(30_000);

const CHAIN_ID = exclusiveChainIds.aptos;
const RPC = ['https://fullnode.mainnet.aptoslabs.com'];

let chainConfig: ChainData;

beforeAll(async () => {
  chainConfig = await DZapClient.getChainConfig();
});

describe('Aptos classifier (live — Aptos mainnet)', () => {
  it('classifies a Move coin type string as TOKEN', async () => {
    const result = await classifyAptosvmAddress({
      // LayerZero USDC on Aptos — coin type format, no RPC call needed
      address: '0xf22bede237a07cbe7e75617acfdb7f68fca78f4eff8d3b2aa6f5adcd99ab7600::asset::USDC',
      chainId: CHAIN_ID,
      chainConfig,
      rpcUrls: RPC,
    });
    expect(result?.kind).toBe(AddressKind.TOKEN);
    expect(result?.isToken).toBe(true);
  });

  it('classifies Aptos framework (0x1) as CONTRACT', async () => {
    const result = await classifyAptosvmAddress({
      address: '0x1', // has many published Move modules
      chainId: CHAIN_ID,
      chainConfig,
      rpcUrls: RPC,
    });
    expect(result?.kind).toBe(AddressKind.CONTRACT);
    expect(result?.isContract).toBe(true);
  });

  it('classifies an unused account address as WALLET', async () => {
    const result = await classifyAptosvmAddress({
      // Non-existent account (404) or account with no modules → WALLET
      address: '0x1e4a0bb22fb2e8948c9d39a3df0f3cf0c8ea2fada748a1e42e68c1b49b6e55e0',
      chainId: CHAIN_ID,
      chainConfig,
      rpcUrls: RPC,
    });
    expect(result?.kind).toBe(AddressKind.WALLET);
    expect(result?.isContract).toBe(false);
  });
});
