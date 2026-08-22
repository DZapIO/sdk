import { ZapPathAsset } from './path';

export const svmFeeAccountType = {
  /** Associated Token Account — holds user's token balance for a specific mint. Created once per (wallet, mint) pair; reused if already exists. */
  ata: 'ata',

  /** NFT Mint — unique on-chain identity of a CLMM LP position. New mint per position; burned and rent recovered on close. */
  nftMint: 'nft_mint',

  /** Personal Position PDA — stores user's LP state (liquidity, fee checkpoints, tokens owed). Always created on open; rent refunded on close. */
  position: 'position',

  /** Protocol Position PDA — stores pool-level tick range state; shared across all LPs in the same [lowerTick, upperTick] range. Created once per range; rent non-refundable. */
  protocolPosition: 'protocol_position',

  /** Tick Array PDA — stores tick data for a contiguous chunk of ticks; shared across all pool activity in that range. Created on first use; rent non-refundable. */
  tickArray: 'tick_array',

  /** Bin Array PDA — stores bin data for a contiguous chunk of bins; shared across all pool activity in that range. Created on first use; rent non-refundable. */
  binArray: 'bin_array',

  /** Bin Array Bitmap Extension PDA — extra bitmap state for bins outside the default bitmap range. Created on first use; rent non-refundable. */
  bitmapExtension: 'bitmap_extension',
} as const;

export const evmFeeAccountType = {
  fee: 'fee',
} as const;

export type SVMFeeAccountType = (typeof svmFeeAccountType)[keyof typeof svmFeeAccountType];

export type EVMFeeAccountType = (typeof evmFeeAccountType)[keyof typeof evmFeeAccountType];

export type ZapFee = {
  amount: string;
  amountUSD: string;
  asset: ZapPathAsset;
  included: boolean;
  refundable: boolean;
  accountType: SVMFeeAccountType | EVMFeeAccountType;
};
