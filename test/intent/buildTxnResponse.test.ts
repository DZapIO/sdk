import { TX_RESPONSE_TYPE } from '../../src/constants';
import { HexString, TradeBuildTxnResponse, isSignTradeBuildTxnResponse } from '../../src/types';

const ACCOUNT: HexString = '0x1111111111111111111111111111111111111111';
const CONTRACT: HexString = '0x2222222222222222222222222222222222222222';

const base = { status: 'success', txId: '0xabc', chainId: 1, gasless: false, private: false, quotes: {}, additionalInfo: {}, updatedQuotes: {} };

const signPayload = { standard: 'eip712', domain: { chainId: 1, verifyingContract: CONTRACT }, types: {}, primaryType: 'Order', message: {} };

describe('isSignTradeBuildTxnResponse', () => {
  test('narrows a sign response to its signPayload', () => {
    const response = {
      ...base,
      type: TX_RESPONSE_TYPE.sign,
      broadcastViaProvider: true,
      from: ACCOUNT,
      signPayload,
      transaction: { type: TX_RESPONSE_TYPE.sign, from: ACCOUNT, broadcastViaProvider: true, signPayload },
    } as unknown as TradeBuildTxnResponse;

    expect(isSignTradeBuildTxnResponse(response)).toBe(true);
    if (!isSignTradeBuildTxnResponse(response)) return;
    expect(response.transaction.signPayload.primaryType).toBe('Order');
    expect(response.transaction.signPayload.domain.verifyingContract).toBe(CONTRACT);
  });

  test('an execution response is not treated as an order to sign', () => {
    const response = {
      ...base,
      type: TX_RESPONSE_TYPE.execution,
      data: '0xdeadbeef',
      to: CONTRACT,
      from: ACCOUNT,
      transaction: { type: TX_RESPONSE_TYPE.execution, from: ACCOUNT, data: '0xdeadbeef', to: CONTRACT, value: '0', gasLimit: '210000' },
    } as unknown as TradeBuildTxnResponse;

    expect(isSignTradeBuildTxnResponse(response)).toBe(false);
    if (isSignTradeBuildTxnResponse(response)) return;
    expect(response.data).toBe('0xdeadbeef');
  });

  // a backend that predates the discriminator still returns the flat execution fields
  test('a legacy response with no type field is treated as execution', () => {
    const response = { ...base, data: '0xdeadbeef', to: CONTRACT, from: ACCOUNT } as unknown as TradeBuildTxnResponse;

    expect(isSignTradeBuildTxnResponse(response)).toBe(false);
  });
});
