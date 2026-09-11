/**
 * What a fee entry on a route is charging for.
 *
 * `fee` is the protocol/integrator fee taken from the trade. Every other value is Solana account rent the
 * transaction has to fund; `refundable` on the entry says whether closing that account gives the rent back.
 */
export const zapFeeType = {
  /** protocol or integrator fee taken out of the traded amount */
  fee: 'fee',

  /** Associated Token Account — holds the user's balance for one mint. Created once per (wallet, mint); reused after that. */
  ata: 'ata',

  /** NFT Mint — on-chain identity of a CLMM LP position. Burned and its rent recovered when the position closes. */
  nftMint: 'nft_mint',

  /** Personal Position PDA — the user's LP state. Always created on open; rent refunded on close. */
  position: 'position',

  /** Protocol Position PDA — pool-level tick range state, shared across every LP in that range. Rent is not refundable. */
  protocolPosition: 'protocol_position',

  /** Tick Array PDA — tick data for a chunk of ticks, shared across the pool. Rent is not refundable. */
  tickArray: 'tick_array',

  /** Bin Array PDA — bin data for a chunk of bins, shared across the pool. Rent is not refundable. */
  binArray: 'bin_array',

  /** Bin Array Bitmap Extension PDA — bitmap state for bins outside the default range. Rent is not refundable. */
  bitmapExtension: 'bitmap_extension',
} as const;

/** Why an amount is returned to the user rather than being part of the requested output. */
export const zapRefundType = {
  /** extra tokens the route ended up with because slippage came out in the user's favour */
  dust: 'dust',
  /** account rent returned to the payer, e.g. when a position is closed */
  rent: 'rent',
} as const;
