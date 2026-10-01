import axios from 'axios';
import { exclusiveChainIds } from '../../../src/constants/chains';
import { StatusCodes, TxnStatus } from '../../../src/enums';
import { suivmAdapter } from '../../../src/transactionHandlers/adapters/suivm';
import { TradeBuildTxnRequest, TradeBuildTxnResponse } from '../../../src/types';

jest.mock('axios');
jest.mock('../../../src/utils/date', () => ({ sleep: jest.fn(() => Promise.resolve()) }));

const post = axios.post as jest.Mock;

const signer = { signTransactionBytes: jest.fn(async () => ({ bytes: 'signedBytes', signature: 'signature' })) };

const send = () =>
  suivmAdapter.sendTrade({
    chainId: exclusiveChainIds.sui,
    signer,
    request: {} as TradeBuildTxnRequest,
    txnData: { from: '0x1', data: 'txBytes' } as TradeBuildTxnResponse,
    rpcUrls: ['https://sui.example'],
  });

const rpcResult = (result: unknown) => ({ status: 200, data: { result } });

describe('sui trade sending', () => {
  beforeEach(() => {
    post.mockReset();
    signer.signTransactionBytes.mockClear();
  });

  it('signs the api built bytes and executes them', async () => {
    post.mockResolvedValue(rpcResult({ digest: 'digest', effects: { status: { status: 'success' } } }));

    await expect(send()).resolves.toEqual({ txnHash: 'digest' });

    expect(signer.signTransactionBytes).toHaveBeenCalledWith('txBytes');
    expect(post).toHaveBeenCalledWith(
      'https://sui.example',
      expect.objectContaining({
        method: 'sui_executeTransactionBlock',
        params: ['signedBytes', ['signature'], { showEffects: true, showRawEffects: true }],
      }),
      expect.anything(),
    );
  });

  it('falls back to the next rpc when one is down or refuses the request', async () => {
    post
      .mockRejectedValueOnce(Object.assign(new Error('Request failed with status code 401'), { isAxiosError: true }))
      .mockResolvedValueOnce(rpcResult({ digest: 'digest', effects: { status: { status: 'success' } } }));

    await expect(
      suivmAdapter.sendTrade({
        chainId: exclusiveChainIds.sui,
        signer,
        request: {} as TradeBuildTxnRequest,
        txnData: { from: '0x1', data: 'txBytes' } as TradeBuildTxnResponse,
        rpcUrls: ['https://bad.example', 'https://sui.example'],
      }),
    ).resolves.toEqual({ txnHash: 'digest' });
    expect(post.mock.calls.map(([url]) => url)).toEqual(['https://bad.example', 'https://sui.example']);
  });

  it('reports that no rpc served the call rather than a dzap api failure', async () => {
    post.mockRejectedValue(Object.assign(new Error('getaddrinfo ENOTFOUND'), { isAxiosError: true }));

    await expect(send()).rejects.toMatchObject({ code: StatusCodes.Error, message: expect.stringContaining('No Sui rpc could serve') });
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('asks for an rpc when it has none, as there is no hardcoded fallback', async () => {
    await expect(
      suivmAdapter.sendTrade({
        chainId: exclusiveChainIds.sui,
        signer,
        request: {} as TradeBuildTxnRequest,
        txnData: { from: '0x1', data: 'txBytes' } as TradeBuildTxnResponse,
      }),
    ).rejects.toMatchObject({ code: StatusCodes.InvalidRequest });
    expect(post).not.toHaveBeenCalled();
  });

  it('does not retry a call the node answered with an error', async () => {
    post.mockResolvedValue({ status: 200, data: { error: { message: 'Transaction is rejected as invalid' } } });

    await expect(send()).rejects.toThrow('Transaction is rejected as invalid');
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('reports the effects to the wallet', async () => {
    post.mockResolvedValue(rpcResult({ digest: 'digest', effects: { status: { status: 'success' } }, rawEffects: [1, 2, 3] }));
    const reportTransactionEffects = jest.fn(async () => undefined);

    await suivmAdapter.sendTrade({
      chainId: exclusiveChainIds.sui,
      signer: { ...signer, reportTransactionEffects },
      request: {} as TradeBuildTxnRequest,
      txnData: { from: '0x1', data: 'txBytes' } as TradeBuildTxnResponse,
      rpcUrls: ['https://sui.example'],
    });

    expect(reportTransactionEffects).toHaveBeenCalledWith(Buffer.from([1, 2, 3]).toString('base64'));
  });

  it('throws a contract execution error with the move error for a tx that failed on chain', async () => {
    post.mockResolvedValue(rpcResult({ digest: 'digest', effects: { status: { status: 'failure', error: 'MoveAbort' } } }));

    await expect(send()).rejects.toMatchObject({
      code: StatusCodes.ContractExecutionError,
      message: 'Transaction failed on chain: MoveAbort',
      txnHash: 'digest',
    });
  });

  it('resolves with the digest without waiting when the execution returned no effects', async () => {
    post.mockResolvedValueOnce(rpcResult({ digest: 'digest' }));

    await expect(send()).resolves.toEqual({ txnHash: 'digest' });
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('looks up a digest that was not indexed yet until it settles', async () => {
    post
      .mockResolvedValueOnce({ status: 200, data: { error: { message: 'Could not find the referenced transaction' } } })
      .mockResolvedValueOnce(rpcResult({ effects: { status: { status: 'success' } } }));

    const result = await suivmAdapter.waitForTransaction({ chainId: exclusiveChainIds.sui, txnHash: 'digest', rpcUrls: ['https://sui.example'] });

    expect(result).toEqual({ status: TxnStatus.success, txnHash: 'digest' });
    expect(post).toHaveBeenLastCalledWith('https://sui.example', expect.objectContaining({ method: 'sui_getTransactionBlock' }), expect.anything());
  });

  it('throws the rpc error', async () => {
    post.mockResolvedValue({ status: 200, data: { error: { message: 'Transaction is rejected as invalid' } } });

    await expect(send()).rejects.toThrow('Transaction is rejected as invalid');
  });

  it('refuses zap steps, as there are none on sui', async () => {
    await expect(suivmAdapter.sendZapStep({ chainId: exclusiveChainIds.sui, signer, step: {} as never })).rejects.toMatchObject({
      code: StatusCodes.InvalidRequest,
    });
  });

  it('reports an rpc outage while waiting as an error, not as a pending tx', async () => {
    let now = 0;
    jest.spyOn(Date, 'now').mockImplementation(() => (now += 0.5) - 0.5);
    post.mockRejectedValue(Object.assign(new Error('getaddrinfo ENOTFOUND'), { isAxiosError: true }));

    const result = await suivmAdapter.waitForTransaction({
      chainId: exclusiveChainIds.sui,
      txnHash: 'digest',
      rpcUrls: ['https://sui.example'],
      timeoutMs: 1,
    });

    expect(result).toMatchObject({ status: TxnStatus.error, txnHash: 'digest' });
    jest.restoreAllMocks();
  });

  it('reports a digest that did not settle in time as mining', async () => {
    const result = await suivmAdapter.waitForTransaction({ chainId: exclusiveChainIds.sui, txnHash: 'digest', timeoutMs: 0 });

    expect(result).toEqual({ status: TxnStatus.mining, txnHash: 'digest' });
  });
});
