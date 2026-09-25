export enum AppEnv {
  production = 'production',
  development = 'development',
}

export enum ZapPermitType {
  PERMIT,
  PERMIT2,
}

export enum DZapPermitMode {
  PERMIT, // EIP2612
  PERMIT2_APPROVE,
  PERMIT2_WITNESS_TRANSFER,
  BATCH_PERMIT2_WITNESS_TRANSFER,
}

export enum DZapV1PermitMode {
  PERMIT,
  PERMIT2_TRANSFER_FROM,
  PERMIT2_APPROVE,
}

export enum ContractVersion {
  v1 = 'v1',
  v2 = 'v2',
}

export enum TxnStatus {
  mining = 'mining',
  success = 'success',
  rejected = 'rejected',
  error = 'error',
  reverted = 'reverted',
  pendingWalletConfirmation = 'pendingWalletConfirmation',
  partialSuccess = 'partialSuccess',
  waitingForExecution = 'waitingForExecution',
}

export enum Versions {
  V1 = 'v1',
  V1_2 = 'v1.2',
  V2 = 'v2',
}

/**
 * The `code` of a {@link DZapTransactionResponse}. When a request to the DZap API itself fails, `code`
 * is instead the HTTP status the API answered with.
 */
export enum StatusCodes {
  /** The transaction was sent. */
  Success = 200,
  /** The request cannot be served: the signer does not fit the chain, or the chain or transaction data is not supported. */
  InvalidRequest = 400,
  /** The transaction was sent, but was not confirmed in time. It may still land; look it up by `txnHash`. */
  TransactionNotConfirmed = 408,
  /** The DZap API simulated the transaction and it would fail. `action` suggests what the user can do about it. */
  SimulationFailure = 417,
  /** The wallet's RPC refused the request, usually because of rate limits. Retrying later can help. */
  WalletRPCFailure = 429,
  /** Anything else. `errorMsg` says what happened and `error` holds the original error. */
  Error = 500,
  /** The user rejected the request in their wallet. */
  UserRejectedRequest = 4001,
  FunctionNotFound = 32771, // 0x8003
  /** The contract call failed: when estimating it, or on chain when `txnHash` is set. */
  ContractExecutionError = -500,
}
