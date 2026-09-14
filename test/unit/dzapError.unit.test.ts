import {
  DZapError,
  DZapErrorCode,
  DZapErrorName,
  ValidationError,
  ConfigError,
  RPCError,
  ProviderError,
  TransactionError,
  SlippageError,
  AllowanceError,
  UserRejectedError,
  ServerError,
  UnknownError,
  isDZapError,
} from '../../src/errors';

/**
 * The SDK previously exported no Error subclasses, so integrators had to
 * string-match `errorMsg` to tell a user rejection from a slippage failure.
 * These tests pin the contract that replaces that.
 */

describe('DZapError hierarchy', () => {
  it('every subclass is instanceof its own type, DZapError and Error', () => {
    const cases: DZapError[] = [
      new ValidationError('bad input'),
      new ConfigError('missing api key'),
      new RPCError(DZapErrorCode.RpcUnavailable, 'rpc down'),
      new ProviderError(DZapErrorCode.ProviderUnavailable, 'provider down'),
      new TransactionError(DZapErrorCode.TransactionReverted, 'reverted'),
      new SlippageError('slippage too high'),
      new AllowanceError('approval needed'),
      new UserRejectedError(),
      new ServerError('500'),
      new UnknownError('mystery'),
    ];

    for (const error of cases) {
      expect(error).toBeInstanceOf(DZapError);
      expect(error).toBeInstanceOf(Error);
      expect(isDZapError(error)).toBe(true);
    }
  });

  it('preserves the specific subclass for instanceof narrowing', () => {
    expect(new SlippageError('x')).toBeInstanceOf(SlippageError);
    expect(new SlippageError('x')).not.toBeInstanceOf(ValidationError);
    expect(new UserRejectedError()).toBeInstanceOf(UserRejectedError);
    expect(new UserRejectedError()).not.toBeInstanceOf(ServerError);
  });

  it('sets name and code from the hierarchy, not the class name', () => {
    const slippage = new SlippageError('too high');
    expect(slippage.name).toBe(DZapErrorName.SlippageError);
    expect(slippage.code).toBe(DZapErrorCode.SlippageTooHigh);

    const rejected = new UserRejectedError();
    expect(rejected.name).toBe(DZapErrorName.UserRejectedError);
    expect(rejected.code).toBe(DZapErrorCode.UserRejected);
    expect(rejected.message).toBe('Rejected by user');

    const rpc = new RPCError(DZapErrorCode.Timeout, 'timed out');
    expect(rpc.name).toBe(DZapErrorName.RPCError);
    expect(rpc.code).toBe(DZapErrorCode.Timeout);
  });

  it('preserves cause and hoists its stack to the real failure site', () => {
    const root = new Error('underlying rpc failure');
    const wrapped = new TransactionError(DZapErrorCode.TransactionFailed, 'could not send', root);

    expect(wrapped.cause).toBe(root);
    expect(wrapped.stack).toBe(root.stack);
  });

  it('works without a cause', () => {
    const error = new ValidationError('no cause here');

    expect(error.cause).toBeUndefined();
    expect(error.stack).toBeDefined();
  });

  it('is throwable and catchable as a normal error', () => {
    expect(() => {
      throw new AllowanceError('approve first');
    }).toThrow(AllowanceError);

    try {
      throw new SlippageError('moved');
    } catch (caught) {
      expect(isDZapError(caught)).toBe(true);
      if (isDZapError(caught)) {
        // The narrowing that string matching could never give us.
        expect(caught.code).toBe(DZapErrorCode.SlippageTooHigh);
      }
    }
  });

  it('isDZapError rejects non-DZap errors', () => {
    expect(isDZapError(new Error('plain'))).toBe(false);
    expect(isDZapError(null)).toBe(false);
    expect(isDZapError(undefined)).toBe(false);
    expect(isDZapError({ code: 1009 })).toBe(false);
    expect(isDZapError('slippage')).toBe(false);
  });
});

describe('DZapErrorCode', () => {
  it('has no duplicate values', () => {
    // A duplicated code would silently collapse two distinct failure modes
    // into one branch for every consumer switching on it.
    const values = Object.values(DZapErrorCode).filter((v) => typeof v === 'number');
    expect(new Set(values).size).toBe(values.length);
  });

  it('codes are stable numbers in the documented range', () => {
    const values = Object.values(DZapErrorCode).filter((v): v is number => typeof v === 'number');

    expect(values.length).toBeGreaterThan(0);
    for (const value of values) {
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(1000);
    }
  });
});
