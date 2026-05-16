/**
 * Integration tests for the TON address classifier.
 * Makes REAL calls to the TonCenter v2 API.
 *
 * Addresses used:
 *   WALLET   — uninitialized address (getAddressInformation returns no code)
 *   TOKEN    — USDT Jetton master (get_jetton_data exit_code 0)
 *   CONTRACT — active non-Jetton contract (has code, get_jetton_data exit_code ≠ 0)
 *
 * Note: TonCenter free tier allows ~1 req/s.
 * beforeEach adds a 1.5 s delay to stay within the rate limit.
 */

import { DZapClient } from '../../src';
import { classifyTonvmAddress } from '../../src/utils/address/tonvm';
import { ChainData } from '../../src/types';
import { AddressKind } from '../../src/types/address';
import { exclusiveChainIds } from '../../src/constants/chains';

jest.setTimeout(30_000);

const CHAIN_ID = exclusiveChainIds.ton;
const RPC = ['https://toncenter.com/api/v2'];

let chainConfig: ChainData;

beforeAll(async () => {
  chainConfig = await DZapClient.getChainConfig();
});

describe('TON classifier (live — TON mainnet)', () => {
  // TonCenter free tier is rate-limited to ~1 req/s; add spacing to avoid 429s
  beforeEach(() => new Promise((resolve) => setTimeout(resolve, 1500)));

  it('classifies an uninitialized address as WALLET', async () => {
    const result = await classifyTonvmAddress({
      // Uninitialized — getAddressInformation returns no code → WALLET
      address: 'EQBsGx9ArADUrREB34W-ghgsCgBShvfUr4Jvlu-0KGc33Rbt',
      chainId: CHAIN_ID,
      chainConfig,
      rpcUrls: RPC,
    });
    expect(result?.kind).toBe(AddressKind.WALLET);
    expect(result?.isContract).toBe(false);
  });

  it('classifies USDT Jetton master as TOKEN', async () => {
    const result = await classifyTonvmAddress({
      // TON USDT Jetton master — get_jetton_data returns exit_code 0
      address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
      chainId: CHAIN_ID,
      chainConfig,
      rpcUrls: RPC,
    });
    expect(result?.kind).toBe(AddressKind.TOKEN);
    expect(result?.isToken).toBe(true);
    expect(result?.isContract).toBe(true);
  });

  it('classifies an active non-Jetton contract as CONTRACT', async () => {
    const result = await classifyTonvmAddress({
      // Has code, get_jetton_data returns exit_code 32 (not a Jetton)
      address: 'EQA0i8-CdGnF_DhUHHf92R1ONH6sIA9vLZ_WLcCIhfBBXwtG',
      chainId: CHAIN_ID,
      chainConfig,
      rpcUrls: RPC,
    });
    expect(result?.kind).toBe(AddressKind.CONTRACT);
    expect(result?.isContract).toBe(true);
    expect(result?.isToken).toBe(false);
  });
});
