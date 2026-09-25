import { Wallet } from 'ethers';
import { WaitForTransactionReceiptTimeoutError } from 'viem';
import { StatusCodes, TxnStatus } from '../../../src/enums';
import { evmAdapter } from '../../../src/transactionHandlers/adapters/evm';
import { hypevmAdapter } from '../../../src/transactionHandlers/adapters/hypevm';
import { TradeBuildTxnRequest, TradeBuildTxnResponse } from '../../../src/types';
import * as utils from '../../../src/utils';

jest.mock('../../../src/utils/eip-5792/batchApproveTokens', () => ({ generateApprovalBatchCalls: jest.fn() }));
jest.mock('../../../src/utils/eip-5792/sendBatchCalls', () => ({ sendBatchCalls: jest.fn() }));
jest.mock('../../../src/utils/eip-5792/waitForBatchTransactionReceipt', () => ({ waitForBatchTransactionReceipt: jest.fn() }));

import { generateApprovalBatchCalls } from '../../../src/utils/eip-5792/batchApproveTokens';
import { sendBatchCalls } from '../../../src/utils/eip-5792/sendBatchCalls';
import { waitForBatchTransactionReceipt } from '../../../src/utils/eip-5792/waitForBatchTransactionReceipt';

const ARBITRUM = 42161;
const USER = '0x99BCEBf44433E901597D9fCb16E799a4847519f6';
const ROUTER = '0x000000000000000000000000000000000000dEaD';

const walletClient = () => ({ transport: {}, request: jest.fn(), account: { address: USER }, sendTransaction: jest.fn(async () => '0xhash') });

const build = { from: USER, to: ROUTER, data: '0x1234', value: '5', gasLimit: '100000' } as unknown as TradeBuildTxnResponse;
const request = { data: [{ srcToken: '0x1', amount: '10' }] } as unknown as TradeBuildTxnRequest;

describe('evm adapter', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('sends a trade from the build sender with a viem wallet client', async () => {
    const signer = walletClient();

    await expect(evmAdapter.sendTrade({ chainId: ARBITRUM, signer: signer as never, request, txnData: build })).resolves.toEqual({
      txnHash: '0xhash',
    });

    expect(signer.sendTransaction).toHaveBeenCalledWith(expect.objectContaining({ account: USER, to: ROUTER, data: '0x1234', value: BigInt(5) }));
  });

  it('sends a zap step from the wallet account with an ethers signer', async () => {
    const signer = Wallet.createRandom();
    const sendTransaction = jest.spyOn(signer, 'sendTransaction').mockResolvedValue({ hash: '0xethers' } as never);

    const result = await evmAdapter.sendZapStep({
      chainId: ARBITRUM,
      signer,
      step: { type: 'evm', txnId: '0x01', callTo: ROUTER, callData: '0xab', value: '0', estimatedGas: '21000' },
    });

    expect(result).toEqual({ txnHash: '0xethers' });
    expect(sendTransaction).toHaveBeenCalledWith(expect.objectContaining({ from: signer.address, to: ROUTER, data: '0xab', gasLimit: '21000' }));
  });

  it('batches the token approvals with the trade', async () => {
    (generateApprovalBatchCalls as jest.Mock).mockResolvedValue([{ to: '0x1', data: '0xapprove', value: BigInt(0) }]);
    (sendBatchCalls as jest.Mock).mockResolvedValue({ id: '0xbatch' });
    (waitForBatchTransactionReceipt as jest.Mock).mockResolvedValue({ transactionHash: '0xbatched' });
    const signer = walletClient();

    const result = await evmAdapter.sendTrade({ chainId: ARBITRUM, signer: signer as never, request, txnData: build, batchTransaction: true });

    expect(result).toEqual({ txnHash: '0xbatched' });
    expect((sendBatchCalls as jest.Mock).mock.calls[0][1]).toHaveLength(2);
    expect(signer.sendTransaction).not.toHaveBeenCalled();
  });

  it('sends the trade alone when nothing needs approving', async () => {
    (generateApprovalBatchCalls as jest.Mock).mockResolvedValue([]);
    const signer = walletClient();

    await evmAdapter.sendTrade({ chainId: ARBITRUM, signer: signer as never, request, txnData: build, batchTransaction: true });

    expect(sendBatchCalls).not.toHaveBeenCalled();
    expect(signer.sendTransaction).toHaveBeenCalled();
  });

  it('reports a receipt that did not come in time as mining', async () => {
    jest.spyOn(utils, 'getPublicClient').mockReturnValue({
      waitForTransactionReceipt: jest.fn().mockRejectedValue(new WaitForTransactionReceiptTimeoutError({ hash: '0xhash' })),
    } as never);

    const result = await evmAdapter.waitForTransaction({ chainId: ARBITRUM, txnHash: '0xhash', timeoutMs: 1 });

    expect(result).toEqual({ status: TxnStatus.mining, txnHash: '0xhash' });
  });

  it('tells apart a solana signer from an evm one', () => {
    expect(evmAdapter.isSigner(walletClient() as never)).toBe(true);
    expect(evmAdapter.isSigner({ signTransaction: jest.fn() } as never)).toBe(false);
  });
});

describe('hyperliquid adapter', () => {
  it('only sends trades', async () => {
    await expect(hypevmAdapter.sendTransaction({ chainId: 1337, signer: walletClient() as never, txnData: build })).rejects.toMatchObject({
      code: StatusCodes.InvalidRequest,
    });
  });

  it('takes an action to be settled once submitted', async () => {
    await expect(hypevmAdapter.waitForTransaction({ chainId: 1337, txnHash: 'hash' })).resolves.toEqual({
      status: TxnStatus.success,
      txnHash: 'hash',
    });
  });
});
