import type { AxiosError } from 'axios';
import { AtomicReadyWalletRejectedUpgradeError, decodeAbiParameters, parseAbiParameters } from 'viem';

import { StatusCodes, TxnStatus } from '../enums';
import type { HexString } from '../types';

export const BRIDGE_ERRORS = {
  BridgeCallFailed: 'BridgeCallFailed',
};

/**
 * Error class for validation errors
 * Used by ConfigValidationError for configuration validation
 */
export class DZapValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public originalError?: unknown,
  ) {
    super(message);
    this.name = 'DZapValidationError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DZapValidationError);
    }
  }
}

export function getErrorName(errorString: string | undefined | null): string | null {
  if (!errorString || typeof errorString !== 'string') {
    return null;
  }
  const match = errorString.match(/Error: (\w+)/);
  return match ? match[1] : null;
}

export const getRevertMsg = (res: string) => {
  if (res.length < 68) {
    return res;
  }
  const revertData = ('0x' + res.slice(10)) as HexString;
  const msg = decodeAbiParameters(parseAbiParameters('string'), revertData)[0];
  return msg;
};

export const isAxiosError = (error: unknown): error is AxiosError => {
  return error !== null && typeof error === 'object' && 'isAxiosError' in error && (error as AxiosError).isAxiosError === true;
};

/**
 * Type guard to check if error has a code property
 */
export const hasErrorCode = (error: unknown): error is { code: number | string } => {
  return typeof error === 'object' && error !== null && 'code' in error;
};

/**
 * Type guard to check if error has a cause property
 */
export const hasErrorCause = (error: unknown): error is { cause?: unknown } => {
  return typeof error === 'object' && error !== null && 'cause' in error;
};

/**
 * Type guard to check if error has shortMessage property (Viem error)
 */
export const hasShortMessage = (error: unknown): error is { shortMessage?: string } => {
  return typeof error === 'object' && error !== null && 'shortMessage' in error;
};

/**
 * Type guard to check if error has metaMessages property (Viem error)
 */
export const hasMetaMessages = (error: unknown): error is { metaMessages?: string[] } => {
  return typeof error === 'object' && error !== null && 'metaMessages' in error && Array.isArray((error as { metaMessages?: unknown }).metaMessages);
};

/**
 * Safely get error code from error object
 */
export const getErrorCode = (error: unknown): StatusCodes | number | undefined => {
  if (hasErrorCode(error)) {
    const code = typeof error.code === 'number' ? error.code : Number(error.code);
    if (!isNaN(code)) {
      return code;
    }
  }
  if (hasErrorCause(error) && hasErrorCode(error.cause)) {
    const code = typeof error.cause.code === 'number' ? error.cause.code : Number(error.cause.code);
    if (!isNaN(code)) {
      return code;
    }
  }
  return undefined;
};

/**
 * Standardized error response handler for user rejection and general errors
 * Returns appropriate status and code based on error type
 * @param error - The error to handle
 * @param defaultErrorCode - Default error code to use if not UserRejectedRequest (defaults to StatusCodes.Error)
 * @returns Object with status and code
 */
export const handleStandardError = (
  error: unknown,
  defaultErrorCode: StatusCodes | number = StatusCodes.Error,
): { status: TxnStatus.rejected | TxnStatus.error; code: StatusCodes | number } => {
  const errorCode = getErrorCode(error);
  if (errorCode === StatusCodes.UserRejectedRequest) {
    return {
      status: TxnStatus.rejected,
      code: StatusCodes.UserRejectedRequest,
    };
  }
  return {
    status: TxnStatus.error,
    code: errorCode || defaultErrorCode,
  };
};

export const handleViemTransactionError = ({ error }: { error: unknown }) => {
  const errorCode = getErrorCode(error);

  if (errorCode === StatusCodes.WalletRPCFailure) {
    return {
      error,
      errorMsg: 'Too many requests, failure on user wallet',
      code: StatusCodes.WalletRPCFailure,
      status: TxnStatus.error,
    };
  }

  if (errorCode === StatusCodes.UserRejectedRequest) {
    return {
      error,
      errorMsg: 'Rejected by User',
      code: StatusCodes.UserRejectedRequest,
      status: TxnStatus.rejected,
    };
  }

  let errMsg = 'Transaction failed';
  if (hasShortMessage(error) && error.shortMessage) {
    errMsg = error.shortMessage;
  }

  if (hasMetaMessages(error) && error.metaMessages && error.metaMessages.length > 0) {
    const errName = getErrorName(error.metaMessages[0]);
    if (errName === BRIDGE_ERRORS.BridgeCallFailed && error.metaMessages[1]) {
      let msg = error.metaMessages[1];
      try {
        const match = error.metaMessages[1].match(/\((.*?)\)/);
        if (match && match[1]) {
          msg = getRevertMsg(match[1]);
        }
      } catch {
        // If revert message extraction fails, use original message
        // Error is already logged by caller
      }
      errMsg = `${BRIDGE_ERRORS.BridgeCallFailed} : ${msg}`;
    } else if (errName) {
      errMsg = errName;
    }
  }

  return {
    status: TxnStatus.error,
    error,
    errorMsg: errMsg,
    code: StatusCodes.ContractExecutionError,
  };
};

export const isAtomicReadyWalletRejectedUpgradeError = (e: unknown): boolean => {
  if (typeof e !== 'object' || e === null) {
    return false;
  }

  const error = e as { cause?: { code?: number; details?: string; name?: string }; name?: string };

  if (error.cause?.code === AtomicReadyWalletRejectedUpgradeError.code) {
    return true;
  }

  const details = error.cause?.details?.toLowerCase();
  const isTransactionError = error.name === 'TransactionExecutionError' || error.cause?.name === 'TransactionExecutionError';
  const hasRejectedUpgrade = Boolean(details?.includes('rejected') && details?.includes('upgrade'));
  const has7702ErrorCode = Boolean(details?.includes('7702'));

  return Boolean(isTransactionError && (hasRejectedUpgrade || has7702ErrorCode));
};
