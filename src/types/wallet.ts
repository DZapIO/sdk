import { type WalletCallReceipt as _WalletCallReceipt } from 'viem';

export type WalletCallReceipt = _WalletCallReceipt<bigint, 'success' | 'reverted'>;
