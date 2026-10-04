jest.mock('../../../src/api', () => ({
  fetchZapBuildTxnData: jest.fn(),
  fetchZapBundleBuildTx: jest.fn(),
}));

jest.mock('../../../src/utils', () => ({
  isTypeSigner: jest.fn(),
  getPublicClient: jest.fn(),
}));

jest.mock('../../../src/utils/errors', () => ({
  handleViemTransactionError: jest.fn().mockReturnValue({ status: 'error', errorMsg: 'handled' }),
}));

jest.mock('../../../src/chains', () => ({
  viemChainsById: { 42161: { id: 42161, name: 'Arbitrum' } },
}));

import ZapTxnHandler from '../../../src/transactionHandlers/zap';
import { fetchZapBuildTxnData } from '../../../src/api';
import { isTypeSigner } from '../../../src/utils';
import { TxnStatus } from '../../../src/enums';
import { chainTypes } from '../../../src/constants/chains';
import { zapStepAction } from '../../../src/zap/constants/step';
import { createMockWalletClient } from '../../helpers/mocks/signer';
import { ZapEvmTxnDetails } from '../../../src/types/zap/step';

const mockedIsTypeSigner = isTypeSigner as jest.MockedFunction<typeof isTypeSigner>;

describe('transactionHandlers/zap', () => {
  const txnData: ZapEvmTxnDetails = {
    type: chainTypes.evm,
    txnId: '0x1234',
    callData: '0xabc',
    callTo: '0x0000000000000000000000000000000000000001',
    value: '0',
    estimatedGas: '21000',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedIsTypeSigner.mockReturnValue(false);
  });

  it('execute sends transaction via viem wallet', async () => {
    const signer = createMockWalletClient();
    const result = await ZapTxnHandler.execute({
      chainId: 42161,
      txnData,
      signer,
    });
    expect(signer.sendTransaction).toHaveBeenCalled();
    expect(result.status).toBe(TxnStatus.success);
    expect(result.txnHash).toBe('0xdef456');
  });

  it('zap returns error when no steps in route', async () => {
    (fetchZapBuildTxnData as jest.Mock).mockResolvedValue({ data: { steps: [] } });
    const signer = createMockWalletClient();
    const result = await ZapTxnHandler.zap({
      request: { srcChainId: 42161 } as any,
      signer,
    });
    expect(result.status).toBe(TxnStatus.error);
    expect((result as any).errorMsg).toContain('No steps found');
  });

  it('zap executes steps and returns txn hash', async () => {
    const signer = createMockWalletClient();
    const result = await ZapTxnHandler.zap({
      request: { srcChainId: 42161 } as any,
      steps: [{ action: zapStepAction.execute, data: txnData }],
      signer,
    });
    expect(result.status).toBe(TxnStatus.success);
    expect((result as any).txnHash).toBe('0xdef456');
  });

  it('zap returns error when no executable steps', async () => {
    const signer = createMockWalletClient();
    const result = await ZapTxnHandler.zap({
      request: { srcChainId: 42161 } as any,
      steps: [{ action: 'unknown' as typeof zapStepAction.execute, data: txnData }],
      signer,
    });
    expect(result.status).toBe(TxnStatus.error);
    expect((result as any).errorMsg).toContain('No executable steps');
  });
});
