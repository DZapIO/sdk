jest.mock('../../../src/api', () => ({
  fetchTradeBuildTxnData: jest.fn(),
  executeGaslessTxnData: jest.fn(),
}));

jest.mock('../../../src/utils', () => ({
  isTypeSigner: jest.fn(),
}));

jest.mock('../../../src/utils/eip-5792/batchApproveTokens', () => ({
  generateApprovalBatchCalls: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../../src/utils/eip-5792/sendBatchCalls', () => ({
  sendBatchCalls: jest.fn(),
}));

jest.mock('../../../src/transactionHandlers/hyperliquid', () => ({
  HyperLiquidTxHandler: {
    sendTransaction: jest.fn(),
  },
}));

import { AxiosError } from 'axios';
import TradeTxnHandler from '../../../src/transactionHandlers/trade';
import { fetchTradeBuildTxnData } from '../../../src/api';
import { isTypeSigner } from '../../../src/utils';
import { HyperLiquidTxHandler } from '../../../src/transactionHandlers/hyperliquid';
import { TxnStatus, StatusCodes } from '../../../src/enums';
import { exclusiveChainIds } from '../../../src/constants/chains';
import { createMockWalletClient } from '../../helpers/mocks/signer';

const mockedIsTypeSigner = isTypeSigner as jest.MockedFunction<typeof isTypeSigner>;

describe('transactionHandlers/trade', () => {
  const buildResponse = {
    data: '0xabc',
    from: '0x99BCEBf44433E901597D9fCb16E799a4847519f6',
    to: '0x0000000000000000000000000000000000000001',
    value: '0',
    gasLimit: '21000',
    additionalInfo: {},
    updatedQuotes: {},
  };

  const baseRequest = {
    fromChain: 42161,
    data: [{ srcToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', amount: '100' }],
    sender: '0x99BCEBf44433E901597D9fCb16E799a4847519f6',
    refundee: '0x99BCEBf44433E901597D9fCb16E799a4847519f6',
    publicKey: '0x99BCEBf44433E901597D9fCb16E799a4847519f6',
    gasless: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedIsTypeSigner.mockReturnValue(false);
  });

  it('buildAndSendTransaction uses provided txnData', async () => {
    const signer = createMockWalletClient();
    const result = await TradeTxnHandler.buildAndSendTransaction({
      request: baseRequest as any,
      signer,
      txnData: buildResponse as any,
      batchTransaction: false,
    });
    expect(fetchTradeBuildTxnData).not.toHaveBeenCalled();
    expect(result.status).toBe(TxnStatus.success);
    expect(result.txnHash).toBe('0xdef456');
  });

  it('buildAndSendTransaction fetches txn data when not provided', async () => {
    (fetchTradeBuildTxnData as jest.Mock).mockResolvedValue(buildResponse);
    const signer = createMockWalletClient();
    await TradeTxnHandler.buildAndSendTransaction({
      request: baseRequest as any,
      signer,
      batchTransaction: false,
    });
    expect(fetchTradeBuildTxnData).toHaveBeenCalledWith(baseRequest);
  });

  it('routes to HyperLiquid handler for hyperliquid chain', async () => {
    (HyperLiquidTxHandler.sendTransaction as jest.Mock).mockResolvedValue({
      status: TxnStatus.success,
      txnHash: '0xhl',
    });
    const signer = createMockWalletClient();
    const request = { ...baseRequest, fromChain: exclusiveChainIds.hyperLiquid };
    await TradeTxnHandler.buildAndSendTransaction({
      request: request as any,
      signer,
      txnData: buildResponse as any,
      batchTransaction: false,
    });
    expect(HyperLiquidTxHandler.sendTransaction).toHaveBeenCalled();
  });

  it('handles axios simulation failure', async () => {
    const axiosError = new AxiosError('simulation failed');
    axiosError.response = {
      status: StatusCodes.SimulationFailure,
      data: { message: 'sim fail', code: 400, action: 'retry' },
    } as any;
    (fetchTradeBuildTxnData as jest.Mock).mockRejectedValue(axiosError);
    const signer = createMockWalletClient();
    const result = await TradeTxnHandler.buildAndSendTransaction({
      request: baseRequest as any,
      signer,
      batchTransaction: false,
    });
    expect(result.status).toBe(TxnStatus.error);
    expect(result.errorMsg).toBe('Simulation Failed');
  });
});
