import { StatusCodes } from '../enums';

/** Walks the cause chain and returns the deepest error (root cause). */
type ErrorWithCause = Error & { cause?: Error };

export function getRootCause(error: unknown): Error | undefined {
  if (!(error instanceof Error)) return undefined;
  let current: Error | undefined = error;
  while (current) {
    const cause: Error | undefined = (current as ErrorWithCause).cause;
    if (!(cause instanceof Error)) break;
    current = cause;
  }
  return current;
}

export const ErrorName = {
  RPCError: 'RPCError',
  ProviderError: 'ProviderError',
  ServerError: 'ServerError',
  TransactionError: 'TransactionError',
  ValidationError: 'ValidationError',
  BalanceError: 'BalanceError',
  NotFoundError: 'NotFoundError',
  UnknownError: 'UnknownError',
  SlippageError: 'SlippageError',
} as const;

export type ErrorNameType = (typeof ErrorName)[keyof typeof ErrorName];

/** Base error for SDK-internal typed errors (code and optional cause). */
export class BaseError extends Error {
  code: StatusCodes | number;
  cause?: Error;

  constructor(name: ErrorNameType, code: StatusCodes | number, message: string, cause?: Error) {
    super(message);
    this.name = name;
    this.code = code;
    this.cause = cause;
    const rootCause = getRootCause(cause);
    if (rootCause?.stack) {
      this.stack = rootCause.stack;
    }
  }
}

export class RPCError extends BaseError {
  constructor(code: StatusCodes | number, message: string, cause?: Error) {
    super(ErrorName.RPCError, code, message, cause);
  }
}

export class ProviderError extends BaseError {
  constructor(code: StatusCodes | number, message: string, cause?: Error) {
    super(ErrorName.ProviderError, code, message, cause);
  }
}

export class TransactionError extends BaseError {
  constructor(code: StatusCodes | number, message: string, cause?: Error) {
    super(ErrorName.TransactionError, code, message, cause);
  }
}

export class UnknownError extends BaseError {
  constructor(message: string, cause?: Error) {
    super(ErrorName.UnknownError, StatusCodes.Error, message, cause);
  }
}

export class BalanceError extends BaseError {
  constructor(message: string, cause?: Error) {
    super(ErrorName.BalanceError, StatusCodes.BalanceError, message, cause);
  }
}

export class ServerError extends BaseError {
  constructor(message: string, cause?: Error) {
    super(ErrorName.ServerError, StatusCodes.Error, message, cause);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, cause?: Error) {
    super(ErrorName.ValidationError, StatusCodes.ValidationError, message, cause);
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string, cause?: Error) {
    super(ErrorName.NotFoundError, StatusCodes.NotFound, message, cause);
  }
}

export class SlippageError extends BaseError {
  constructor(message: string, cause?: Error) {
    super(ErrorName.SlippageError, StatusCodes.SlippageError, message, cause);
  }
}

/** Top-level wrapper for throw-based APIs (e.g. getQuote, buildTxn). */
export class DZapError extends Error {
  override name = 'DZapError';
  declare readonly cause: BaseError;
  code: StatusCodes | number;

  constructor(cause: BaseError) {
    const message = cause.message ? `[${cause.name}] ${cause.message}` : 'Unknown error occurred';
    super(message);
    this.name = 'DZapError';
    this.cause = cause;
    this.code = cause.code;
    this.stack = cause.stack;
  }
}
