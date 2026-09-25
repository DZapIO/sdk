import { AxiosError, AxiosHeaders } from 'axios';
import { StatusCodes, TxnStatus } from '../../src/enums';
import { DZapTxnError, toTxnErrorResponse } from '../../src/utils/errors';

const apiError = (status: number, data: unknown) =>
  new AxiosError('Request failed', 'ERR_BAD_RESPONSE', undefined, undefined, {
    status,
    data,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

describe('transaction error responses', () => {
  it('keeps the code and hash of an error the sdk raised, and reports an on-chain failure as reverted', () => {
    const response = toTxnErrorResponse(new DZapTxnError(StatusCodes.ContractExecutionError, 'Transaction failed on chain', { txnHash: 'hash' }));

    expect(response).toMatchObject({
      status: TxnStatus.reverted,
      code: StatusCodes.ContractExecutionError,
      errorMsg: 'Transaction failed on chain',
      txnHash: 'hash',
    });
  });

  it('reports a transaction that was not confirmed as an error that still carries its hash', () => {
    const response = toTxnErrorResponse(
      new DZapTxnError(StatusCodes.TransactionNotConfirmed, 'Transaction was not confirmed in time', { txnHash: 'hash' }),
    );

    expect(response).toMatchObject({ status: TxnStatus.error, code: StatusCodes.TransactionNotConfirmed, txnHash: 'hash' });
  });

  it.each([
    ['an evm wallet', Object.assign(new Error('User rejected the request.'), { code: 4001 })],
    ['a wrapped evm error', Object.assign(new Error('Transaction failed'), { cause: { code: 4001 } })],
    ['a solana adapter', Object.assign(new Error('Something'), { name: 'WalletSignTransactionError' })],
    ['a sui wallet', new Error('User rejects approval')],
  ])('reports a rejection by %s as rejected', (_, error) => {
    expect(toTxnErrorResponse(error)).toMatchObject({
      status: TxnStatus.rejected,
      code: StatusCodes.UserRejectedRequest,
      errorMsg: 'Rejected by User',
    });
  });

  it('does not take an rpc error that says a tx was rejected for a user rejection', () => {
    expect(toTxnErrorResponse(new Error('Transaction is rejected as invalid'))).toMatchObject({
      status: TxnStatus.error,
      code: StatusCodes.Error,
      errorMsg: 'Transaction is rejected as invalid',
    });
  });

  it('reports a failed simulation with the action the api suggests', () => {
    const response = toTxnErrorResponse(apiError(417, { message: 'insufficient output', code: 417, action: 'INCREASE_SLIPPAGE' }));

    expect(response).toMatchObject({
      status: TxnStatus.error,
      code: 417,
      errorMsg: 'Simulation Failed',
      error: 'insufficient output',
      action: 'INCREASE_SLIPPAGE',
    });
  });

  it('reports any other api failure with its http status and message', () => {
    expect(toTxnErrorResponse(apiError(400, { message: 'amount is required' }))).toMatchObject({
      status: TxnStatus.error,
      code: 400,
      errorMsg: 'DZap API request failed: amount is required',
    });
  });

  it('names the custom error an evm contract reverted with', () => {
    const viemError = Object.assign(new Error('Execution reverted'), {
      shortMessage: 'Execution reverted',
      metaMessages: ['Error: InsufficientBalance()'],
    });

    expect(toTxnErrorResponse(viemError)).toMatchObject({
      status: TxnStatus.error,
      code: StatusCodes.ContractExecutionError,
      errorMsg: 'InsufficientBalance',
    });
  });

  it('falls back to the message of any other error', () => {
    expect(toTxnErrorResponse(new Error('socket hang up'))).toMatchObject({
      status: TxnStatus.error,
      code: StatusCodes.Error,
      errorMsg: 'socket hang up',
    });
  });
});
