import { JsonRpcError, SuiHTTPStatusError, SuiHTTPTransportError } from '@mysten/sui/client';
import {
  SendTransactionError,
  SolanaJSONRPCError,
  TransactionExpiredBlockheightExceededError,
  TransactionExpiredNonceInvalidError,
  TransactionExpiredTimeoutError,
} from '@solana/web3.js';
import { type AxiosError, isAxiosError } from 'axios';
import { BaseError as ViemBaseError, decodeAbiParameters, parseAbiParameters } from 'viem';

import { StatusCodes, TxnStatus } from '../enums';
import type { contractErrorActions, ContractErrorResponse, HexString } from '../types';
import { BaseError as DZapBaseError } from './baseError.js';

export {
  BalanceError,
  BaseError,
  DZapError,
  getRootCause,
  NotFoundError,
  ProviderError,
  RPCError,
  ServerError,
  SlippageError,
  TransactionError,
  UnknownError,
  ValidationError,
} from './baseError.js';

export const BRIDGE_ERRORS = {
  BridgeCallFailed: 'BridgeCallFailed',
};

class ErrorParser {
  public parseError(
    error: unknown,
    includeError?: boolean,
  ): { status: TxnStatus; code: StatusCodes | number; errorMsg: string; action?: keyof typeof contractErrorActions; error?: unknown } {
    if (error instanceof DZapBaseError) {
      return this.parseDZapBaseError(error, includeError);
    }

    if (error instanceof ViemBaseError) {
      return this.parseViemError(error, includeError);
    }

    if (isAxiosError(error)) {
      return this.parseAxiosError(error, includeError);
    }

    const solanaError = this.parseSolanaError(error, includeError);
    if (solanaError) {
      return solanaError;
    }

    const suiError = this.parseSuiError(error, includeError);
    if (suiError) {
      return suiError;
    }

    return this.parseGenericError(error, includeError);
  }

  private parseDZapBaseError(
    error: DZapBaseError,
    includeError?: boolean,
  ): { status: TxnStatus; code: StatusCodes | number; errorMsg: string; action?: keyof typeof contractErrorActions; error?: unknown } {
    const status = error.code === StatusCodes.UserRejectedRequest ? TxnStatus.rejected : TxnStatus.error;
    return {
      status,
      code: error.code,
      errorMsg: error.message,
      ...(includeError && { error }),
    };
  }

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

  private parseViemError(error: ViemBaseError, includeError?: boolean): { status: TxnStatus; code: StatusCodes | number; errorMsg: string } {
    const getErrorName = (errorString: string | undefined | null): string | null => {
      if (!errorString || typeof errorString !== 'string') {
        return null;
      }
      const match = errorString.match(/Error: (\w+)/);
      return match ? match[1] : null;
    };

    const getRevertMsg = (res: string) => {
      if (res.length < 68) {
        return res;
      }
      const revertData = ('0x' + res.slice(10)) as HexString;
      const msg = decodeAbiParameters(parseAbiParameters('string'), revertData)[0];
      return msg;
    };
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
      const errName = getErrorName(error.metaMessages[0]);
      if (errName === BRIDGE_ERRORS.BridgeCallFailed && error.metaMessages[1]) {
        let msg = error.metaMessages[1];
        try {
          const match = error.metaMessages[1].match(/\((.*?)\)/);
          if (match && match[1]) {
            msg = getRevertMsg(match[1]);
          }
        } catch {
          /* keep original metaMessages[1] on decode failure */
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
      ...(includeError && { error }),
    };
  }

  private parseAxiosError(
    error: AxiosError,
    includeError?: boolean,
  ): {
    status: TxnStatus;
    code: StatusCodes | number;
    errorMsg: string;
    action?: keyof typeof contractErrorActions;
  } {
    const errorCode = error.status;
    const statusCode = error.response?.status;

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
      ...(includeError && { error: responseData }),
    };
  }

  private parseSolanaError(
    error: unknown,
    includeError?: boolean,
  ): { status: TxnStatus; code: StatusCodes | number; errorMsg: string; error?: unknown } | null {
    if (!(error instanceof Error)) {
      return null;
    }

    if (error.message.includes('User rejected') || error.name === 'WalletSignTransactionError') {
      return {
        code: StatusCodes.UserRejectedRequest,
        status: TxnStatus.rejected,
        errorMsg: 'Transaction rejected by user',
        ...(includeError && { error }),
      };
    }

    if (error instanceof SendTransactionError) {
      const transactionError = error.transactionError;
      const logs = error.logs;
      let errorMsg = transactionError.message || error.message || 'Transaction failed';

      if (logs && logs.length > 0) {
        errorMsg += `\nLogs: ${logs.join('\n')}`;
      }

      return {
        code: StatusCodes.ContractExecutionError,
        status: TxnStatus.error,
        errorMsg,
        ...(includeError && { error }),
      };
    }

    if (error instanceof SolanaJSONRPCError) {
      const errorCode = typeof error.code === 'number' ? error.code : StatusCodes.Error;
      const errorMsg = error.message || 'RPC error occurred';

      return {
        code: errorCode,
        status: TxnStatus.error,
        errorMsg,
        ...(includeError && { error }),
      };
    }

    if (error instanceof TransactionExpiredBlockheightExceededError) {
      return {
        code: StatusCodes.TransactionExpired,
        status: TxnStatus.error,
        errorMsg: `Transaction expired: blockheight exceeded. Signature: ${error.signature}`,
        ...(includeError && { error }),
      };
    }

    if (error instanceof TransactionExpiredTimeoutError) {
      return {
        code: StatusCodes.TransactionExpired,
        status: TxnStatus.error,
        errorMsg: error.message || `Transaction expired: timeout exceeded. Signature: ${error.signature}`,
        ...(includeError && { error }),
      };
    }

    if (error instanceof TransactionExpiredNonceInvalidError) {
      return {
        code: StatusCodes.TransactionExpired,
        status: TxnStatus.error,
        errorMsg: `Transaction expired: nonce invalid. Signature: ${error.signature}`,
        ...(includeError && { error }),
      };
    }

    return null;
  }

  private parseSuiError(
    error: unknown,
    includeError?: boolean,
  ): { status: TxnStatus; code: StatusCodes | number; errorMsg: string; error?: unknown } | null {
    if (!(error instanceof Error)) {
      return null;
    }

    const msg = error.message?.toLowerCase() ?? '';
    if (msg.includes('rejected from user') || msg.includes('user rejected') || msg.includes('rejected by user')) {
      return {
        code: StatusCodes.UserRejectedRequest,
        status: TxnStatus.rejected,
        errorMsg: 'Transaction rejected by user',
        ...(includeError && { error }),
      };
    }

    if (error instanceof JsonRpcError) {
      const code =
        error.type === 'TransactionExecutionClientError' || error.type === 'CallExecutionFailed' ? StatusCodes.ContractExecutionError : error.code;
      return {
        code,
        status: TxnStatus.error,
        errorMsg: error.message || 'Sui RPC error',
        ...(includeError && { error }),
      };
    }

    if (error instanceof SuiHTTPStatusError) {
      return {
        code: error.status,
        status: TxnStatus.error,
        errorMsg: error.message || `Sui request failed: ${error.status} ${error.statusText}`,
        ...(includeError && { error }),
      };
    }

    if (error instanceof SuiHTTPTransportError) {
      return {
        code: StatusCodes.Error,
        status: TxnStatus.error,
        errorMsg: error.message || 'Sui request failed',
        ...(includeError && { error }),
      };
    }

    return null;
  }

  private parseGenericError(error: unknown, includeError?: boolean): { status: TxnStatus; code: StatusCodes | number; errorMsg: string } {
    const errorCode = this.getErrorCode(error);

    let errorMsg = 'An error occurred';
    if (error instanceof Error) {
      errorMsg = error.message || errorMsg;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }

    return {
      status: TxnStatus.error,
      errorMsg,
      code: errorCode || StatusCodes.Error,
      ...(includeError && { error }),
    };
  }
}

const errorParser = new ErrorParser();

export function parseError(
  error: unknown,
  includeError?: boolean,
): { status: TxnStatus; code: StatusCodes | number; errorMsg: string; action?: keyof typeof contractErrorActions; error?: unknown } {
  return errorParser.parseError(error, includeError);
}
