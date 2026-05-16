/**
 * Integration tests for the Tron address classifier.
 * Makes REAL /wallet/getcontract calls to the Tron mainnet API.
 *
 * Addresses used:
 *   WALLET   — plain wallet (no bytecode in /wallet/getcontract response)
 *   TOKEN    — Tether USDT TRC-20 (has bytecode + 'decimals' in ABI)
 *   CONTRACT — non-TRC-20 contract (has bytecode, no 'decimals' in ABI)
 */

import { DZapClient } from '../../src';
import { classifyTronvmAddress } from '../../src/utils/address/tronvm';
import { ChainData } from '../../src/types';
import { exclusiveChainIds } from '../../src/constants/chains';
import { AddressKind } from '../../src/types/address';

jest.setTimeout(30_000);

const CHAIN_ID = exclusiveChainIds.tron;
const RPC = ['https://api.trongrid.io'];

let chainConfig: ChainData;

beforeAll(async () => {
  chainConfig = await DZapClient.getChainConfig();
});

describe('Tron classifier (live — Tron mainnet)', () => {
  it('classifies a regular wallet as WALLET', async () => {
    const result = await classifyTronvmAddress({
      // Plain wallet — /wallet/getcontract returns {} (no bytecode)
      address: 'TJDjBYVUgbQWuBiEJU8K6fYvriDvKT5JVg',
      chainId: CHAIN_ID,
      chainConfig,
      rpcUrls: RPC,
    });
    expect(result?.kind).toBe(AddressKind.WALLET);
    expect(result?.isContract).toBe(false);
  });

  it('classifies USDT TRC-20 as TOKEN', async () => {
    const result = await classifyTronvmAddress({
      // Tether USDT on Tron — has bytecode + 'decimals' entry in ABI
      address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      chainId: CHAIN_ID,
      chainConfig,
      rpcUrls: RPC,
    });
    expect(result?.kind).toBe(AddressKind.TOKEN);
    expect(result?.isToken).toBe(true);
    expect(result?.isContract).toBe(true);
  });

  it('classifies a non-token smart contract as CONTRACT', async () => {
    const result = await classifyTronvmAddress({
      // Has bytecode, ABI has no 'decimals' entry → CONTRACT not TOKEN
      address: 'TKzxdSv2FZKQrEqkKVgp5DcwEXBEKMg2Ax',
      chainId: CHAIN_ID,
      chainConfig,
      rpcUrls: RPC,
    });
    expect(result?.kind).toBe(AddressKind.CONTRACT);
    expect(result?.isContract).toBe(true);
    expect(result?.isToken).toBe(false);
  });
});
