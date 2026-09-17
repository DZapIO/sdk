export type TokenAmount = { token: string; amount: bigint };

// what an account sent and received in a transaction, as read from the chain
export type TokenMovements = {
  sent: ReadonlyArray<TokenAmount>;
  received?: ReadonlyArray<TokenAmount>;
};
