export enum AppEnv {
  'production' = 'production',
  'development' = 'development',
}

export enum ZapPermitType {
  PERMIT,
  PERMIT2,
}

export enum PermitType {
  PERMIT,
  PERMIT2_TRANSFER_FROM,
  PERMIT2_APPROVE,
}

export enum TxnStatus {
  mining = 'mining',
  success = 'success',
  rejected = 'rejected',
  error = 'error',
  reverted = 'reverted',
  pendingWalletConfirmation = 'pendingWalletConfirmation',
  partialSuccess = 'partialSuccess',
}

export enum Versions {
  V1 = 'v1',
  V1_2 = 'v1.2',
  V2 = 'v2',
}

export enum StatusCodes {
  UserRejectedRequest = 4001,
  Success = 200,
  FunctionNotFound = 32771, // 0x8003
  Error = 500, // @TODO update as per need
  WalletRPCFailure = 429,
  SimulationFailure = 417,
  ContractExecutionError = -500,
}
