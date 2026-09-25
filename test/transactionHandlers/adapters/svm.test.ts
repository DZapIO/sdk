import { Connection, Keypair, SystemProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { exclusiveChainIds } from '../../../src/constants/chains';
import { StatusCodes, TxnStatus } from '../../../src/enums';
import { svmAdapter } from '../../../src/transactionHandlers/adapters/svm';
import { TradeBuildTxnRequest, TradeBuildTxnResponse } from '../../../src/types';

jest.mock('@solana/web3.js', () => ({ ...jest.requireActual('@solana/web3.js'), Connection: jest.fn() }));
jest.mock('../../../src/api', () => ({ broadcastTradeTx: jest.fn(), executeZapSvmBundle: jest.fn() }));
jest.mock('../../../src/utils/date', () => ({ sleep: jest.fn(() => Promise.resolve()) }));

import { broadcastTradeTx, executeZapSvmBundle } from '../../../src/api';

const broadcast = broadcastTradeTx as jest.Mock;
const executeBundle = executeZapSvmBundle as jest.Mock;

const user = Keypair.generate();
const BUILT_BLOCKHASH = Keypair.generate().publicKey.toBase58();
const FRESH_BLOCKHASH = Keypair.generate().publicKey.toBase58();
const SIGNATURE = 'signature';

const buildTx = () => {
  const message = new TransactionMessage({
    payerKey: user.publicKey,
    recentBlockhash: BUILT_BLOCKHASH,
    instructions: [SystemProgram.transfer({ fromPubkey: user.publicKey, toPubkey: Keypair.generate().publicKey, lamports: 1 })],
  }).compileToV0Message();
  return Buffer.from(new VersionedTransaction(message).serialize()).toString('base64');
};

const signer = {
  signTransaction: jest.fn(async (tx: VersionedTransaction) => {
    tx.sign([user]);
    return tx;
  }),
};

const confirmed = { slot: 1, confirmations: 1, err: null, confirmationStatus: 'confirmed' as const };

const mockRpc = ({ statuses, blockHeight = 0 }: { statuses: unknown[]; blockHeight?: number }) => {
  const statusQueue = [...statuses];
  const rpc = {
    getLatestBlockhash: jest.fn(async () => ({ blockhash: FRESH_BLOCKHASH, lastValidBlockHeight: 100 })),
    sendRawTransaction: jest.fn(async () => SIGNATURE),
    getSignatureStatuses: jest.fn(async () => ({ context: { slot: 1 }, value: [statusQueue.length > 1 ? statusQueue.shift() : statusQueue[0]] })),
    getBlockHeight: jest.fn(async () => blockHeight),
  };
  (Connection as unknown as jest.Mock).mockImplementation(() => rpc);
  return rpc;
};

const finalized = { ...confirmed, confirmationStatus: 'finalized' as const };

// a trade as the api builds it: svmTxData is only there when the api signed part of the tx
const send = (build: Partial<TradeBuildTxnResponse> = {}) =>
  svmAdapter.sendTrade({
    chainId: exclusiveChainIds.solana,
    signer,
    request: {} as TradeBuildTxnRequest,
    txnData: { txId: 'txId', from: user.publicKey.toBase58(), data: buildTx(), ...build } as TradeBuildTxnResponse,
    rpcUrls: ['https://solana.example'],
  });

describe('solana trade sending', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    broadcast.mockReset();
    executeBundle.mockReset();
    signer.signTransaction.mockClear();
  });

  it('signs with a fresh blockhash and resends the tx until it is confirmed', async () => {
    const rpc = mockRpc({ statuses: [null, null, confirmed] });

    await expect(send()).resolves.toEqual({ txnHash: SIGNATURE });

    expect(signer.signTransaction.mock.calls[0][0].message.recentBlockhash).toBe(FRESH_BLOCKHASH);
    // the first send, then a resend on each poll that did not find the tx
    expect(rpc.sendRawTransaction).toHaveBeenCalledTimes(3);
  });

  it('stops resending once the tx has landed', async () => {
    const rpc = mockRpc({ statuses: [{ ...confirmed, confirmationStatus: 'processed' }, confirmed] });

    await expect(send()).resolves.toEqual({ txnHash: SIGNATURE });

    expect(rpc.sendRawTransaction).toHaveBeenCalledTimes(1);
  });

  it('throws a contract execution error carrying the hash for a tx that failed on chain', async () => {
    mockRpc({ statuses: [{ ...confirmed, err: { InstructionError: [0, 'Custom'] } }] });

    await expect(send()).rejects.toMatchObject({ code: StatusCodes.ContractExecutionError, txnHash: SIGNATURE });
  });

  it('keeps the blockhash of a tx the api already signed part of', async () => {
    const rpc = mockRpc({ statuses: [confirmed] });

    await send({ svmTxData: { blockhash: BUILT_BLOCKHASH, lastValidBlockHeight: 50 } });

    expect(rpc.getLatestBlockhash).not.toHaveBeenCalled();
    expect(signer.signTransaction.mock.calls[0][0].message.recentBlockhash).toBe(BUILT_BLOCKHASH);
  });

  it('gives up once the blockhash has expired', async () => {
    let now = 0;
    jest.spyOn(Date, 'now').mockImplementation(() => (now += 4_000));
    mockRpc({ statuses: [null], blockHeight: 101 });

    await expect(send()).rejects.toMatchObject({ code: StatusCodes.TransactionNotConfirmed, txnHash: SIGNATURE });
  });

  it('broadcasts a tx carrying a third party signature through the api, as built, and waits for it', async () => {
    const rpc = mockRpc({ statuses: [confirmed] });
    broadcast.mockResolvedValue({ status: TxnStatus.success, txnHash: 'broadcastSignature' });

    await expect(send({ broadcastViaProvider: true })).resolves.toEqual({ txnHash: 'broadcastSignature' });

    expect(signer.signTransaction.mock.calls[0][0].message.recentBlockhash).toBe(BUILT_BLOCKHASH);
    expect(broadcast).toHaveBeenCalledWith({ chainId: exclusiveChainIds.solana, txId: 'txId', txData: expect.any(String) });
    expect(rpc.getSignatureStatuses).toHaveBeenCalledWith(['broadcastSignature'], { searchTransactionHistory: true });
    expect(rpc.sendRawTransaction).not.toHaveBeenCalled();
  });

  it('sends a trade made of several txs as a jito bundle', async () => {
    mockRpc({ statuses: [confirmed] });
    executeBundle.mockResolvedValue({ status: TxnStatus.success, data: { txnId: '0x01', txHashes: ['first', 'last'] } });

    await expect(send({ data: [buildTx(), buildTx()] as unknown as string })).resolves.toEqual({ txnHash: 'last' });
  });

  it('lets the wallet error through for the error mapper', async () => {
    mockRpc({ statuses: [confirmed] });
    const rejection = Object.assign(new Error('User rejected the request.'), { name: 'WalletSignTransactionError' });
    signer.signTransaction.mockRejectedValueOnce(rejection);

    await expect(send()).rejects.toBe(rejection);
  });
});

describe('solana zap step sending', () => {
  const sendZap = (data: string[], blockhash?: { blockhash: string; lastValidBlockHeight: number }) =>
    svmAdapter.sendZapStep({
      chainId: exclusiveChainIds.solana,
      signer,
      step: { type: 'svm', txnId: '0x01', data, blockhash, estimatedGas: '0' },
      rpcUrls: ['https://solana.example'],
    });

  beforeEach(() => {
    executeBundle.mockReset();
    signer.signTransaction.mockClear();
  });

  it('sends a single tx to the rpc with the step blockhash and waits for it to be finalized', async () => {
    const rpc = mockRpc({ statuses: [confirmed, finalized] });

    await expect(sendZap([buildTx()], { blockhash: BUILT_BLOCKHASH, lastValidBlockHeight: 50 })).resolves.toEqual({ txnHash: SIGNATURE });

    expect(rpc.getLatestBlockhash).not.toHaveBeenCalled();
    expect(rpc.getSignatureStatuses).toHaveBeenCalledTimes(2);
    expect(executeBundle).not.toHaveBeenCalled();
  });

  it('submits a bundle through the zap api and waits on its last tx', async () => {
    const rpc = mockRpc({ statuses: [null, finalized] });
    executeBundle.mockResolvedValue({ status: TxnStatus.success, data: { txnId: '0x01', txHashes: ['first', 'last'] } });

    await expect(sendZap([buildTx(), buildTx()])).resolves.toEqual({ txnHash: 'last' });

    expect(signer.signTransaction).toHaveBeenCalledTimes(2);
    const [{ txnData }] = executeBundle.mock.calls[0];
    expect(txnData.signedTransactionsBase64).toHaveLength(2);
    expect(rpc.getSignatureStatuses).toHaveBeenLastCalledWith(['last'], { searchTransactionHistory: true });
    expect(rpc.sendRawTransaction).not.toHaveBeenCalled();
  });

  it('throws the reason the zap api gives for a bundle it did not send', async () => {
    mockRpc({ statuses: [confirmed] });
    executeBundle.mockResolvedValue({ status: TxnStatus.error, message: 'bundle dropped', data: { retry: true } });

    await expect(sendZap([buildTx(), buildTx()])).rejects.toMatchObject({ code: StatusCodes.Error, message: 'bundle dropped' });
  });
});

describe('solana transaction waiting', () => {
  it('reports a signature that did not settle in time as mining', async () => {
    mockRpc({ statuses: [null] });

    const result = await svmAdapter.waitForTransaction({ chainId: exclusiveChainIds.solana, txnHash: SIGNATURE, timeoutMs: 0 });

    expect(result).toEqual({ status: TxnStatus.mining, txnHash: SIGNATURE });
  });
});
