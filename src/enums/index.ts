export enum AppEnv {
  'production' = 'production',
  'development' = 'development',
}

export enum Erc20PermitFunctions {
  nonces = 'nonces',
  version = 'version',
  PERMIT_TYPEHASH = 'PERMIT_TYPEHASH',
  allowance = 'allowance',
}

export enum Erc20Functions {
  name = 'name',
  allowance = 'allowance',
  approve = 'approve',
  transfer = 'transfer',
  transferFrom = 'transferFrom',
  balanceof = 'balanceOf',
  decimals = 'decimals',
  symbol = 'symbol',
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

export enum PermitFunctionSelector {
  checkNativeToken = 0,
  checkPermit2 = 1,
  checkPermit1 = 2,
}

export enum PermitSelector {
  DefaultPermit = 0,
  Permit1 = 2,
  Permit2 = 1,
  Permit2Approve = 3,
}
