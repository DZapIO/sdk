export type TokenAmount = { token: string; amount: bigint };

export type SwapAmountDecodeResult = {
  input: ReadonlyArray<TokenAmount>;
  output?: ReadonlyArray<TokenAmount>;
};
