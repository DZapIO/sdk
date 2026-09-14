/**
 * Typed error hierarchy.
 *
 * Before this, the SDK exported no Error subclasses at all: failures came back
 * as plain objects (`{ status, code, errorMsg }`), so integrators had to
 * string-match `errorMsg` to tell a user rejection from a slippage failure from
 * a genuine RPC outage. String matching breaks silently whenever a message is
 * reworded.
 *
 * These classes are additive. The existing `{ status, code, errorMsg }` returns
 * are unchanged, so nothing breaks; consumers who want discriminable errors can
 * start using `instanceof` and the stable numeric codes. Routing every return
 * path through them changes the public contract and is a 3.0.0 change.
 */

export enum DZapErrorName {
  ValidationError = 'ValidationError',
  ConfigError = 'ConfigError',
  RPCError = 'RPCError',
  ProviderError = 'ProviderError',
  TransactionError = 'TransactionError',
  SlippageError = 'SlippageError',
  AllowanceError = 'AllowanceError',
  UserRejectedError = 'UserRejectedError',
  ServerError = 'ServerError',
  UnknownError = 'UnknownError',
}

/**
 * Stable numeric codes. These are part of the public contract: once shipped, a
 * code's meaning must not change, because integrators branch on them and log
 * them. Add new codes rather than repurposing existing ones.
 */
export enum DZapErrorCode {
  InternalError = 1000,
  ValidationError = 1001,
  ConfigError = 1002,
  TransactionFailed = 1003,
  TransactionReverted = 1004,
  Timeout = 1005,
  ProviderUnavailable = 1006,
  NotFound = 1007,
  ChainNotSupported = 1008,
  SlippageTooHigh = 1009,
  UserRejected = 1010,
  AllowanceRequired = 1011,
  InsufficientFunds = 1012,
  InsufficientGas = 1013,
  RateLimitExceeded = 1014,
  RpcUnavailable = 1015,
  SignatureRejected = 1016,
  PermitUnsupported = 1017,
}

/**
 * Base class for every error the SDK raises.
 *
 * Carries the originating error in `cause` and hoists its stack, so the trace
 * points at the real failure site rather than at the wrapper.
 */
export class DZapError extends Error {
  readonly code: DZapErrorCode;
  override readonly cause?: Error;

  constructor(name: DZapErrorName, code: DZapErrorCode, message: string, cause?: Error) {
    super(message);

    this.name = name;
    this.code = code;
    this.cause = cause;

    if (cause?.stack) {
      this.stack = cause.stack;
    }

    // Required for `instanceof` to work when the output targets ES5 and the
    // prototype chain would otherwise be broken by class-extends-builtin.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends DZapError {
  constructor(message: string, cause?: Error) {
    super(DZapErrorName.ValidationError, DZapErrorCode.ValidationError, message, cause);
  }
}

export class ConfigError extends DZapError {
  constructor(message: string, cause?: Error) {
    super(DZapErrorName.ConfigError, DZapErrorCode.ConfigError, message, cause);
  }
}

export class RPCError extends DZapError {
  constructor(code: DZapErrorCode, message: string, cause?: Error) {
    super(DZapErrorName.RPCError, code, message, cause);
  }
}

export class ProviderError extends DZapError {
  constructor(code: DZapErrorCode, message: string, cause?: Error) {
    super(DZapErrorName.ProviderError, code, message, cause);
  }
}

export class TransactionError extends DZapError {
  constructor(code: DZapErrorCode, message: string, cause?: Error) {
    super(DZapErrorName.TransactionError, code, message, cause);
  }
}

export class SlippageError extends DZapError {
  constructor(message: string, cause?: Error) {
    super(DZapErrorName.SlippageError, DZapErrorCode.SlippageTooHigh, message, cause);
  }
}

export class AllowanceError extends DZapError {
  constructor(message: string, cause?: Error) {
    super(DZapErrorName.AllowanceError, DZapErrorCode.AllowanceRequired, message, cause);
  }
}

export class UserRejectedError extends DZapError {
  constructor(message = 'Rejected by user', cause?: Error) {
    super(DZapErrorName.UserRejectedError, DZapErrorCode.UserRejected, message, cause);
  }
}

export class ServerError extends DZapError {
  constructor(message: string, cause?: Error) {
    super(DZapErrorName.ServerError, DZapErrorCode.InternalError, message, cause);
  }
}

export class UnknownError extends DZapError {
  constructor(message: string, cause?: Error) {
    super(DZapErrorName.UnknownError, DZapErrorCode.InternalError, message, cause);
  }
}

/** Narrows an unknown caught value to a DZapError. */
export const isDZapError = (error: unknown): error is DZapError => error instanceof DZapError;
