export enum AppEnv {
  'production' = 'production',
  'development' = 'development',
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

export enum V2PermitMode {
  PERMIT,
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
