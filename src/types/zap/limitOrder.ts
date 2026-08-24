export type ZapLimitOrderStatus = 'open' | 'partiallyFilled' | 'filled' | 'expired' | 'cancelled' | 'invalid';

export type ZapLimitOrderDetails = {
  provider: string;
  orderHash: string;
  status: ZapLimitOrderStatus;
  makerAsset: string;
  takerAsset: string;
  /** Amounts the order was placed with, in the assets' smallest units. */
  makingAmount: string;
  takingAmount: string;
  filledMakingAmount: string;
  remainingMakingAmount: string;
  /** Share of `makingAmount` already filled, 0–100 with 2 decimals. */
  filledPercent: number;
  /** takerAsset per makerAsset, decimal-adjusted — the price the order rests at. */
  limitPrice: string;
  /** Unix seconds; absent when the order never expires. */
  expiresAt?: number;
  createdAt?: string;
  /** Why the provider considers the order unfillable, when it says so. */
  invalidReason?: string;
};
