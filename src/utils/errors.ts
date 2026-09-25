import { AxiosError } from 'axios';
import { AtomicReadyWalletRejectedUpgradeError, decodeAbiParameters, parseAbiParameters } from 'viem';
import { StatusCodes, TxnStatus } from '../enums';
import { ContractErrorResponse, DZapTransactionResponse, HexString } from '../types';

export const BRIDGE_ERRORS = {
  BridgeCallFailed: 'BridgeCallFailed',
};

export function getErrorName(errorString: string) {
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
  return Boolean(error) && (error as AxiosError).isAxiosError;
};

/**
 * An error the sdk raises itself. `code` is what the integrator branches on, see {@link StatusCodes}.
 */
export class DZapTxnError extends Error {
  readonly code: StatusCodes;
  /** set when the transaction was already sent */
  readonly txnHash?: string;
  readonly cause?: unknown;

  constructor(code: StatusCodes, message: string, options: { txnHash?: string; cause?: unknown } = {}) {
    super(message);
    this.name = 'DZapTxnError';
    this.code = code;
    this.txnHash = options.txnHash;
    this.cause = options.cause;
  }
}

// wallets say a user rejected a request in different ways: evm and bigmi wallets with code 4001, solana
// adapters with WalletSignTransactionError, and sui wallets only in the message. The message is matched
// on the user, as rpc errors also say a transaction was rejected
const USER_REJECTED_PATTERN =
  /user rejec|rejected by (the )?user|rejected from user|user denied|denied by (the )?user|user cancel|cancelled by (the )?user/i;

const isUserRejection = (error: any) =>
  error?.code === StatusCodes.UserRejectedRequest ||
  error?.cause?.code === StatusCodes.UserRejectedRequest ||
  error?.name === 'WalletSignTransactionError' ||
  USER_REJECTED_PATTERN.test(error?.message ?? '');

const isWalletRpcFailure = (error: any) => error?.code === StatusCodes.WalletRPCFailure || error?.cause?.code === StatusCodes.WalletRPCFailure;

// viem names the custom error a contract reverted with in its meta messages
const getContractErrorMessage = (error: any): string | undefined => {
  const metaMessages: string[] | undefined = error?.metaMessages;
  if (!metaMessages?.length) return undefined;
  const errName = getErrorName(metaMessages[0]);
  if (errName === BRIDGE_ERRORS.BridgeCallFailed) {
    let msg = metaMessages[1];
    try {
      msg = getRevertMsg((metaMessages[1].match(/\((.*?)\)/) as RegExpMatchArray)[1]);
    } catch (err) {
      // pass
    }
    return `${BRIDGE_ERRORS.BridgeCallFailed} : ${msg}`;
  }
  return errName ?? error.shortMessage;
};

const fromApiError = (error: AxiosError): DZapTransactionResponse => {
  const data = error.response?.data as (ContractErrorResponse & { message?: unknown }) | undefined;
  if (error.response?.status === StatusCodes.SimulationFailure) {
    return {
      status: TxnStatus.error,
      errorMsg: 'Simulation Failed',
      error: data?.message,
      code: data?.code ?? StatusCodes.SimulationFailure,
      action: data?.action,
    };
  }
  const message = typeof data?.message === 'string' ? data.message : JSON.stringify(data?.message ?? error.message);
  return {
    status: TxnStatus.error,
    errorMsg: `DZap API request failed: ${message}`,
    error: data ?? error,
    code: error.response?.status ?? StatusCodes.Error,
  };
};

/**
 * Turns anything a transaction flow throws into a {@link DZapTransactionResponse}, so that every chain
 * reports failures the same way.
 */
export const toTxnErrorResponse = (error: unknown): DZapTransactionResponse => {
  const err = error as any;
  if (err instanceof DZapTxnError) {
    const reverted = err.code === StatusCodes.ContractExecutionError && Boolean(err.txnHash);
    return {
      status: reverted ? TxnStatus.reverted : TxnStatus.error,
      code: err.code,
      errorMsg: err.message,
      ...(err.txnHash ? { txnHash: err.txnHash as HexString } : {}),
      error: err.cause ?? err,
    };
  }
  if (isAxiosError(err)) {
    return fromApiError(err);
  }
  if (isUserRejection(err)) {
    return { status: TxnStatus.rejected, code: StatusCodes.UserRejectedRequest, errorMsg: 'Rejected by User', error };
  }
  if (isWalletRpcFailure(err)) {
    return { status: TxnStatus.error, code: StatusCodes.WalletRPCFailure, errorMsg: 'Too many requests, failure on user wallet', error };
  }
  const contractErrorMessage = getContractErrorMessage(err);
  if (contractErrorMessage) {
    return { status: TxnStatus.error, code: StatusCodes.ContractExecutionError, errorMsg: contractErrorMessage, error };
  }
  return { status: TxnStatus.error, code: StatusCodes.Error, errorMsg: err?.shortMessage ?? err?.message ?? 'Transaction failed', error };
};

/** @deprecated use {@link toTxnErrorResponse} */
export const handleViemTransactionError = ({ error }: { error: unknown }) => toTxnErrorResponse(error);

export const isAtomicReadyWalletRejectedUpgradeError = (e: any) => {
  if (e.cause?.code === AtomicReadyWalletRejectedUpgradeError.code) {
    return true;
  }
  const details = e.cause?.details?.toLowerCase();
  const isTransactionError = e.name === 'TransactionExecutionError' || e.cause?.name === 'TransactionExecutionError';
  const hasRejectedUpgrade = details?.includes('rejected') && details?.includes('upgrade');
  const has7702ErrorCode = details?.includes('7702');

  return isTransactionError && (hasRejectedUpgrade || has7702ErrorCode);
};
