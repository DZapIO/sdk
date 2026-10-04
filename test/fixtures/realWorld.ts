import { arbitrum, mainnet } from 'viem/chains';
import type { HexString } from '../../src/types';

/** Timeout for tests that hit live RPC endpoints */
export const LIVE_TEST_TIMEOUT_MS = 30_000;

export const arbitrumOne = {
  chainId: arbitrum.id,
  rpc: 'https://arb1.arbitrum.io/rpc',
  multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11' as const,
} as const;

/** Circle-issued USDC on Arbitrum One — EIP-2612 permit, 6 decimals */
export const arbitrumUsdc = {
  address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as HexString,
  name: 'USD Coin',
  symbol: 'USDC',
  decimals: 6,
} as const;

export const arbitrumWeth = {
  address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as HexString,
  symbol: 'WETH',
  decimals: 18,
} as const;

/** Uniswap canonical Permit2 deployment (used on Arbitrum and most EVM chains) */
export const permit2 = {
  defaultAddress: '0x000000000022D473030F116dDEE9F6B43aC78BA3' as HexString,
} as const;

export const sampleAccounts = {
  /** Random EOA used across unit tests */
  testWallet: '0x99BCEBf44433E901597D9fCb16E799a4847519f6' as HexString,
  /** Holder with predictable zero nonce for multicall nonces() reads */
  zeroLike: '0x0000000000000000000000000000000000000001' as HexString,
  /** Binance hot wallet — verified EOA on Ethereum mainnet (integration tests) */
  binanceHotWallet: '0x71660c4005BA85c37ccec55d0C4493E66Fe775d3' as HexString,
} as const;

export const ethereumMainnet = {
  chainId: mainnet.id,
  rpc: ['https://ethereum.publicnode.com', 'https://1rpc.io/eth'] as const,
  usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as HexString,
  uniswapV2Router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D' as HexString,
} as const;
