jest.mock('viem/actions', () => ({
  waitForCallsStatus: jest.fn(),
}));

jest.mock('viem/utils', () => ({
  getAction: jest.fn((client, fn) => (params: unknown) => fn(client, params)),
}));

import type { Client } from 'viem';
import { waitForCallsStatus } from 'viem/actions';
import { getAction } from 'viem/utils';
import { waitForBatchTransactionReceipt } from '../../../../src/utils/eip-5792/waitForBatchTransactionReceipt';
import { TxnStatus } from '../../../../src/enums';
import { createMockWalletClient } from '../../../helpers/mocks/signer';

describe('utils/eip-5792/waitForBatchTransactionReceipt', () => {
  const batchHash = '0xde0b295669a9cb93d6339855c10daea6790bee948538fe66ac825bec7ebea765';
  const approvalTxnHash = '0x2f2fd50be3442cfe92d92c66733557691b086154f6287762d967fd067a4338429';
  const swapTxnHash = '0x88df016429689c0793a58908954e692632b30636f6f923933f58f9e5a8e6b335';

  const walletClient = {
    ...createMockWalletClient(),
    uid: 'dzap-test-wallet-client',
    pollingInterval: 4_000,
    chain: { id: 42161, name: 'Arbitrum One' },
  } as unknown as Client;

  const successReceipt = {
    transactionHash: swapTxnHash,
    status: TxnStatus.success,
    blockHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    blockNumber: BigInt(245_000_000),
    gasUsed: BigInt(210_000),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the last receipt when batch succeeds', async () => {
    (waitForCallsStatus as jest.Mock).mockResolvedValue({
      status: TxnStatus.success,
      statusCode: 200,
      receipts: [{ transactionHash: approvalTxnHash, status: TxnStatus.success }, successReceipt],
    });

    const receipt = await waitForBatchTransactionReceipt(walletClient, batchHash);

    expect(getAction).toHaveBeenCalledWith(walletClient, waitForCallsStatus, 'waitForCallsStatus');
    expect(waitForCallsStatus).toHaveBeenCalledWith(walletClient, {
      id: batchHash,
      timeout: 3_600_000 * 24,
    });
    expect(receipt).toBe(successReceipt);
    expect(receipt.transactionHash).toBe(swapTxnHash);
  });

  it('throws when successful batch has no receipts', async () => {
    (waitForCallsStatus as jest.Mock).mockResolvedValue({
      status: TxnStatus.success,
      statusCode: 200,
      receipts: [],
    });

    await expect(waitForBatchTransactionReceipt(walletClient, batchHash)).rejects.toThrow('Transaction was reverted.');
  });

  it('throws when a receipt is missing a transaction hash', async () => {
    (waitForCallsStatus as jest.Mock).mockResolvedValue({
      status: TxnStatus.success,
      statusCode: 200,
      receipts: [{ transactionHash: approvalTxnHash, status: TxnStatus.success }, { status: TxnStatus.success }],
    });

    await expect(waitForBatchTransactionReceipt(walletClient, batchHash)).rejects.toThrow('Transaction was reverted.');
  });

  it('throws when a receipt reverted', async () => {
    (waitForCallsStatus as jest.Mock).mockResolvedValue({
      status: TxnStatus.success,
      statusCode: 200,
      receipts: [
        { transactionHash: approvalTxnHash, status: TxnStatus.success },
        { transactionHash: swapTxnHash, status: TxnStatus.reverted },
      ],
    });

    await expect(waitForBatchTransactionReceipt(walletClient, batchHash)).rejects.toThrow('Transaction was reverted.');
  });

  it('throws when batch was canceled', async () => {
    (waitForCallsStatus as jest.Mock).mockResolvedValue({
      status: TxnStatus.rejected,
      statusCode: 410,
      receipts: [],
    });

    await expect(waitForBatchTransactionReceipt(walletClient, batchHash)).rejects.toThrow('Transaction was canceled.');
  });

  it('throws when batch fails for other reasons', async () => {
    (waitForCallsStatus as jest.Mock).mockResolvedValue({
      status: TxnStatus.error,
      statusCode: 500,
      receipts: [],
    });

    await expect(waitForBatchTransactionReceipt(walletClient, batchHash)).rejects.toThrow('Transaction failed.');
  });
});
