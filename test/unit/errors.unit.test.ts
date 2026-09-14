import { handleViemTransactionError, getErrorName, isAxiosError } from '../../src/utils/errors';
import { StatusCodes, TxnStatus } from '../../src/enums';

/**
 * `handleViemTransactionError` used to read `error.metaMessages[0]`
 * unguarded. viem only populates `metaMessages` on some error classes, so any
 * other error threw a TypeError *from inside the error handler* — destroying
 * the original failure and surfacing an unrelated crash to the integrator.
 */
describe('handleViemTransactionError', () => {
  it('does not throw when metaMessages is absent', () => {
    expect(() => handleViemTransactionError({ error: new Error('boom') })).not.toThrow();
  });

  it('falls back to the error message when shortMessage is absent', () => {
    const result = handleViemTransactionError({ error: new Error('boom') });

    expect(result.errorMsg).toBe('boom');
    expect(result.status).toBe(TxnStatus.error);
    expect(result.code).toBe(StatusCodes.ContractExecutionError);
  });

  it('does not throw when metaMessages is not an array', () => {
    expect(() => handleViemTransactionError({ error: { shortMessage: 'nope', metaMessages: 'not-an-array' } })).not.toThrow();
  });

  it('does not throw on a null error', () => {
    expect(() => handleViemTransactionError({ error: null })).not.toThrow();
  });

  it('still classifies user rejection', () => {
    const result = handleViemTransactionError({ error: { code: StatusCodes.UserRejectedRequest } });

    expect(result.status).toBe(TxnStatus.rejected);
    expect(result.code).toBe(StatusCodes.UserRejectedRequest);
    expect(result.errorMsg).toBe('Rejected by User');
  });

  it('still classifies wallet RPC failure', () => {
    const result = handleViemTransactionError({ error: { cause: { code: StatusCodes.WalletRPCFailure } } });

    expect(result.status).toBe(TxnStatus.error);
    expect(result.code).toBe(StatusCodes.WalletRPCFailure);
  });

  it('still extracts a named contract error from metaMessages', () => {
    const result = handleViemTransactionError({
      error: { shortMessage: 'execution reverted', metaMessages: ['Error: SlippageTooHigh()'] },
    });

    expect(result.errorMsg).toBe('SlippageTooHigh');
  });

  it('does not throw when BridgeCallFailed has no second metaMessage', () => {
    expect(() =>
      handleViemTransactionError({
        error: { shortMessage: 'reverted', metaMessages: ['Error: BridgeCallFailed'] },
      }),
    ).not.toThrow();
  });
});

describe('getErrorName', () => {
  it('extracts the error name', () => {
    expect(getErrorName('Error: SlippageTooHigh()')).toBe('SlippageTooHigh');
  });

  it('returns null when there is no match', () => {
    expect(getErrorName('something else entirely')).toBeNull();
  });
});

describe('isAxiosError', () => {
  it('is false for null and plain errors', () => {
    expect(isAxiosError(null)).toBe(false);
    expect(isAxiosError(new Error('x'))).toBeFalsy();
  });

  it('is true when the axios marker is present', () => {
    expect(isAxiosError({ isAxiosError: true })).toBe(true);
  });
});
