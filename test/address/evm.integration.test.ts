/**
 * Integration tests for the EVM address classifier.
 * Makes REAL eth_getCode / eth_call calls to Ethereum mainnet.
 *
 * Addresses used:
 *   WALLET   — Binance hot-wallet (no bytecode, no EIP-7702 delegation)
 *   TOKEN    — USDC (ERC-20, has decimals())
 *   CONTRACT — Uniswap V2 Router (has bytecode, decimals() reverts)
 */

import { DZapClient } from '../../src';
import { classifyEvmAddress } from '../../src/utils/address/evm';
import { ChainData } from '../../src/types';
import { AddressKind } from '../../src/types/address';
import { exclusiveChainIds } from '../../src/constants/chains';

jest.setTimeout(30_000);

const CHAIN_ID = exclusiveChainIds.ethereum;
const RPC = ['https://ethereum.publicnode.com', 'https://1rpc.io/eth'];

let chainConfig: ChainData;

beforeAll(async () => {
  chainConfig = await DZapClient.getChainConfig();
});

describe('EVM classifier (live — Ethereum mainnet)', () => {
  it('classifies Binance hot-wallet as WALLET', async () => {
    const result = await classifyEvmAddress({
      address: '0x71660c4005BA85c37ccec55d0C4493E66Fe775d3',
      chainId: CHAIN_ID,
      chainConfig,
      rpcUrls: RPC,
    });
    expect(result?.kind).toBe(AddressKind.WALLET);
    expect(result?.valid).toBe(true);
    expect(result?.isContract).toBe(false);
  });

  it('classifies USDC as TOKEN', async () => {
    const result = await classifyEvmAddress({
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      chainId: CHAIN_ID,
      chainConfig,
      rpcUrls: RPC,
    });
    expect(result?.kind).toBe(AddressKind.TOKEN);
    expect(result?.isToken).toBe(true);
    expect(result?.isContract).toBe(true);
  });

  it('classifies Uniswap V2 Router as CONTRACT', async () => {
    const result = await classifyEvmAddress({
      address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      chainId: CHAIN_ID,
      chainConfig,
      rpcUrls: RPC,
    });
    expect(result?.kind).toBe(AddressKind.CONTRACT);
    expect(result?.isContract).toBe(true);
    expect(result?.isToken).toBe(false);
  });
});
