/**
 * Integration tests for the SVM (Solana) address classifier.
 * Makes REAL getParsedAccountInfo calls to Solana mainnet.
 *
 * Addresses used:
 *   WALLET   — non-existent public key (null account → WALLET)
 *   TOKEN    — USDC SPL mint
 *   CONTRACT — SPL Token Program (executable flag)
 */

import { DZapClient } from '../../src';
import { classifySvmAddress } from '../../src/utils/address/svm';
import { ChainData } from '../../src/types';
import { AddressKind } from '../../src/types/address';

jest.setTimeout(30_000);

const CHAIN_ID = 1399811149;
const RPC = ['https://api.mainnet-beta.solana.com'];

let chainConfig: ChainData;

beforeAll(async () => {
  chainConfig = await DZapClient.getChainConfig();
});

describe('SVM classifier (live — Solana mainnet)', () => {
  it('classifies a non-existent public key as WALLET', async () => {
    // Account has never been funded; getParsedAccountInfo returns null → WALLET
    const result = await classifySvmAddress({
      address: 'GRpkBRUKf7dMBQyqJSTLbJFN5K8VWnJyFWMRVaHB3YYE',
      chainId: CHAIN_ID,
      chainConfig,
      rpcUrls: RPC,
    });
    expect(result?.kind).toBe(AddressKind.WALLET);
    expect(result?.valid).toBe(true);
  });

  it('classifies USDC SPL mint as TOKEN', async () => {
    const result = await classifySvmAddress({
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      chainId: CHAIN_ID,
      chainConfig,
      rpcUrls: RPC,
    });
    expect(result?.kind).toBe(AddressKind.TOKEN);
    expect(result?.isToken).toBe(true);
  });

  it('classifies SPL Token Program as CONTRACT (executable)', async () => {
    const result = await classifySvmAddress({
      address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      chainId: CHAIN_ID,
      chainConfig,
      rpcUrls: RPC,
    });
    expect(result?.kind).toBe(AddressKind.CONTRACT);
    expect(result?.isContract).toBe(true);
  });
});
