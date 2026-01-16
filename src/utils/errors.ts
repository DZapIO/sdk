import type { AxiosError } from 'axios';
import { AtomicReadyWalletRejectedUpgradeError, decodeAbiParameters, parseAbiParameters } from 'viem';

import { StatusCodes, TxnStatus } from '../enums';
import type { HexString } from '../types';

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

export const handleViemTransactionError = ({ error }: { error: any }) => {
  if (error?.code === StatusCodes.WalletRPCFailure || error?.cause?.code === StatusCodes.WalletRPCFailure) {
    return {
      error,
      errorMsg: 'Too many requests, failure on user wallet',
      code: StatusCodes.WalletRPCFailure,
      status: TxnStatus.error,
    };
  }
  if (error?.code === StatusCodes.UserRejectedRequest || error?.cause?.code === StatusCodes.UserRejectedRequest) {
    return {
      error,
      errorMsg: 'Rejected by User',
      code: StatusCodes.UserRejectedRequest,
      status: TxnStatus.rejected,
    };
  }
  let errMsg = error.shortMessage;

  const errName = getErrorName(error.metaMessages[0]);

  if (errName == BRIDGE_ERRORS.BridgeCallFailed) {
    let msg = error.metaMessages[1];
    try {
      msg = getRevertMsg(error.metaMessages[1].match(/\((.*?)\)/)[1]);
    } catch {
      // pass
    }
    errMsg = `${BRIDGE_ERRORS.BridgeCallFailed} : ${msg}`;
  } else if (errName) {
    errMsg = errName;
  }
  return {
    status: TxnStatus.error,
    error,
    errorMsg: errMsg,
    code: StatusCodes.ContractExecutionError,
  };
};

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
