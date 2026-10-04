import { AxiosError } from 'axios';
import { AtomicReadyWalletRejectedUpgradeError } from 'viem';
import { StatusCodes, TxnStatus } from '../../../src/enums';
import {
  BRIDGE_ERRORS,
  getErrorName,
  getRevertMsg,
  handleViemTransactionError,
  isAtomicReadyWalletRejectedUpgradeError,
  isAxiosError,
} from '../../../src/utils/errors';

describe('utils/errors', () => {
  it('getErrorName extracts error name from string', () => {
    expect(getErrorName('Error: BridgeCallFailed')).toBe('BridgeCallFailed');
    expect(getErrorName('no match')).toBeNull();
  });

  it('getRevertMsg returns short strings unchanged', () => {
    expect(getRevertMsg('short')).toBe('short');
  });

  it('isAxiosError identifies axios errors', () => {
    const err = new AxiosError('fail');
    expect(isAxiosError(err)).toBe(true);
    expect(isAxiosError(new Error('fail'))).toBeFalsy();
  });

  it('handleViemTransactionError handles wallet RPC failure', () => {
    const result = handleViemTransactionError({ error: { code: StatusCodes.WalletRPCFailure } });
    expect(result.status).toBe(TxnStatus.error);
    expect(result.code).toBe(StatusCodes.WalletRPCFailure);
  });

  it('handleViemTransactionError handles user rejection', () => {
    const result = handleViemTransactionError({ error: { code: StatusCodes.UserRejectedRequest } });
    expect(result.status).toBe(TxnStatus.rejected);
  });

  it('handleViemTransactionError handles BridgeCallFailed', () => {
    const result = handleViemTransactionError({
      error: {
        shortMessage: 'failed',
        metaMessages: [`Error: ${BRIDGE_ERRORS.BridgeCallFailed}`, 'revert (short)'],
      },
    });
    expect(result.errorMsg).toContain(BRIDGE_ERRORS.BridgeCallFailed);
  });

  it('isAtomicReadyWalletRejectedUpgradeError detects EIP-7702 rejection', () => {
    expect(
      isAtomicReadyWalletRejectedUpgradeError({
        cause: { code: AtomicReadyWalletRejectedUpgradeError.code },
      }),
    ).toBe(true);
    expect(
      isAtomicReadyWalletRejectedUpgradeError({
        name: 'TransactionExecutionError',
        cause: { details: 'User rejected upgrade to 7702' },
      }),
    ).toBe(true);
    expect(isAtomicReadyWalletRejectedUpgradeError({ name: 'OtherError' })).toBe(false);
  });
});
