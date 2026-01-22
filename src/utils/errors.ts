import { type AxiosError, isAxiosError } from 'axios';
import { BaseError, decodeAbiParameters, parseAbiParameters } from 'viem';

import { StatusCodes, TxnStatus } from '../enums';
import type { contractErrorActions, ContractErrorResponse, HexString } from '../types';

export const BRIDGE_ERRORS = {
  BridgeCallFailed: 'BridgeCallFailed',
};

/**
 * Error parser class that handles parsing different types of errors
 */
class ErrorParser {
  /**
   * Main parse method that routes to appropriate parser based on error type
   */
  public parseError(
    error: unknown,
    defaultErrorCode: StatusCodes | number = StatusCodes.Error,
  ): { status: TxnStatus; code: StatusCodes | number; errorMsg: string; action?: keyof typeof contractErrorActions } {
    if (error instanceof BaseError) {
      return this.parseViemError(error);
    }

    if (isAxiosError(error)) {
      return this.parseAxiosError(error);
    }

    return this.parseGenericError(error, defaultErrorCode);
  }

  private getErrorName(errorString: string | undefined | null): string | null {
    if (!errorString || typeof errorString !== 'string') {
      return null;
    }
    const match = errorString.match(/Error: (\w+)/);
    return match ? match[1] : null;
  }

  private getRevertMsg = (res: string) => {
    if (res.length < 68) {
      return res;
    }
    const revertData = ('0x' + res.slice(10)) as HexString;
    const msg = decodeAbiParameters(parseAbiParameters('string'), revertData)[0];
    return msg;
  };

  private getErrorCode(error: unknown): StatusCodes | number | undefined {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = typeof error.code === 'number' ? error.code : Number(error.code);
      if (!isNaN(code)) {
        return code;
      }
    }
    if (typeof error === 'object' && error !== null && 'cause' in error && error.cause) {
      const cause = error.cause;
      if (typeof cause === 'object' && cause !== null && 'code' in cause) {
        const code = typeof cause.code === 'number' ? cause.code : Number(cause.code);
        if (!isNaN(code)) {
          return code;
        }
      }
    }
    return undefined;
  }

  private parseViemError(error: BaseError): { status: TxnStatus; code: StatusCodes | number; errorMsg: string } {
    const errorCode = this.getErrorCode(error);

    if (errorCode === StatusCodes.WalletRPCFailure) {
      return {
        errorMsg: 'Too many requests, failure on user wallet',
        code: StatusCodes.WalletRPCFailure,
        status: TxnStatus.error,
      };
    }

    if (errorCode === StatusCodes.UserRejectedRequest) {
      return {
        errorMsg: 'Rejected by User',
        code: StatusCodes.UserRejectedRequest,
        status: TxnStatus.rejected,
      };
    }

    let errMsg = 'Transaction failed';
    if (error.shortMessage) {
      errMsg = error.shortMessage;
    }

    if (error.metaMessages && error.metaMessages.length > 0) {
      const errName = this.getErrorName(error.metaMessages[0]);
      if (errName === BRIDGE_ERRORS.BridgeCallFailed && error.metaMessages[1]) {
        let msg = error.metaMessages[1];
        try {
          const match = error.metaMessages[1].match(/\((.*?)\)/);
          if (match && match[1]) {
            msg = this.getRevertMsg(match[1]);
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
      errorMsg: errMsg,
      code: StatusCodes.ContractExecutionError,
    };
  }

  private parseAxiosError(error: AxiosError): {
    status: TxnStatus;
    code: StatusCodes | number;
    errorMsg: string;
    action?: keyof typeof contractErrorActions;
  } {
    const errorCode = this.getErrorCode(error);
    const statusCode = error.response?.status;

    if (errorCode === StatusCodes.UserRejectedRequest) {
      return {
        errorMsg: 'Rejected by User',
        code: StatusCodes.UserRejectedRequest,
        status: TxnStatus.rejected,
      };
    }

    // Handle simulation failure
    if (statusCode === StatusCodes.SimulationFailure) {
      const responseData = error.response?.data;
      return {
        status: TxnStatus.error,
        errorMsg: (responseData as ContractErrorResponse).message,
        code: (responseData as ContractErrorResponse).code,
        action: (responseData as ContractErrorResponse).action,
      };
    }

    const responseData = error.response?.data;
    const errorMessage =
      typeof responseData === 'object' && responseData !== null && 'message' in responseData
        ? String(responseData.message)
        : error.message || 'Request failed';

    return {
      status: TxnStatus.error,
      errorMsg: errorMessage,
      code: statusCode || errorCode || StatusCodes.Error,
    };
  }

  private parseGenericError(
    error: unknown,
    defaultErrorCode: StatusCodes | number = StatusCodes.Error,
  ): { status: TxnStatus; code: StatusCodes | number; errorMsg: string } {
    const errorCode = this.getErrorCode(error);

    if (errorCode === StatusCodes.UserRejectedRequest) {
      return {
        errorMsg: 'Rejected by User',
        code: StatusCodes.UserRejectedRequest,
        status: TxnStatus.rejected,
      };
    }

    let errorMsg = 'An error occurred';
    if (error instanceof Error) {
      errorMsg = error.message || errorMsg;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }

    return {
      status: TxnStatus.error,
      errorMsg,
      code: errorCode || defaultErrorCode,
    };
  }
}

const errorParser = new ErrorParser();

export function parseError(
  error: unknown,
  defaultErrorCode: StatusCodes | number = StatusCodes.Error,
): { status: TxnStatus; code: StatusCodes | number; errorMsg: string; action?: keyof typeof contractErrorActions } {
  return errorParser.parseError(error, defaultErrorCode);
}
