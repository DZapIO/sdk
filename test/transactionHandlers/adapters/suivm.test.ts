import axios from 'axios';
import { exclusiveChainIds } from '../../../src/constants/chains';
import { StatusCodes, TxnStatus } from '../../../src/enums';
import { suivmAdapter } from '../../../src/transactionHandlers/adapters/suivm';
import { TradeBuildTxnRequest, TradeBuildTxnResponse } from '../../../src/types';

jest.mock('axios');
jest.mock('../../../src/utils/date', () => ({ sleep: jest.fn(() => Promise.resolve()) }));

const post = axios.post as jest.Mock;

const signer = { signTransaction: jest.fn(async () => ({ bytes: 'signedBytes', signature: 'signature' })) };

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
    signer.signTransaction.mockClear();
  });

  it('signs the api built bytes and executes them', async () => {
    post.mockResolvedValue(rpcResult({ digest: 'digest', effects: { status: { status: 'success' } } }));

    await expect(send()).resolves.toEqual({ txnHash: 'digest' });

    expect(signer.signTransaction).toHaveBeenCalledWith('txBytes');
    expect(post).toHaveBeenCalledWith(
      'https://sui.example',
      expect.objectContaining({ method: 'sui_executeTransactionBlock', params: ['signedBytes', ['signature'], { showEffects: true }] }),
    );
  });

  it('throws a contract execution error with the move error for a tx that failed on chain', async () => {
    post.mockResolvedValue(rpcResult({ digest: 'digest', effects: { status: { status: 'failure', error: 'MoveAbort' } } }));

    await expect(send()).rejects.toMatchObject({
      code: StatusCodes.ContractExecutionError,
      message: 'Transaction failed on chain: MoveAbort',
      txnHash: 'digest',
    });
  });

  it('waits for the effects when the execution did not return them', async () => {
    post
      .mockResolvedValueOnce(rpcResult({ digest: 'digest' }))
      .mockResolvedValueOnce({ status: 200, data: { error: { message: 'Could not find the referenced transaction' } } })
      .mockResolvedValueOnce(rpcResult({ effects: { status: { status: 'success' } } }));

    await expect(send()).resolves.toEqual({ txnHash: 'digest' });
    expect(post).toHaveBeenLastCalledWith('https://sui.example', expect.objectContaining({ method: 'sui_getTransactionBlock' }));
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

  it('reports a digest that did not settle in time as mining', async () => {
    const result = await suivmAdapter.waitForTransaction({ chainId: exclusiveChainIds.sui, txnHash: 'digest', timeoutMs: 0 });

    expect(result).toEqual({ status: TxnStatus.mining, txnHash: 'digest' });
  });
});
