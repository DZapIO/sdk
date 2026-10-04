jest.mock('../../../src/utils', () => ({
  isTypeSigner: jest.fn(),
}));

jest.mock('../../../src/utils/errors', () => ({
  handleViemTransactionError: jest.fn().mockReturnValue({
    status: 'error',
    errorMsg: 'handled',
    code: 500,
  }),
}));

jest.mock('../../../src/chains', () => ({
  viemChainsById: { 42161: { id: 42161, name: 'Arbitrum' } },
}));

import GenericTxnHandler from '../../../src/transactionHandlers/generic';
import { isTypeSigner } from '../../../src/utils';
import { handleViemTransactionError } from '../../../src/utils/errors';
import { TxnStatus } from '../../../src/enums';
import { createMockEthersSigner, createMockWalletClient } from '../../helpers/mocks/signer';

const mockedIsTypeSigner = isTypeSigner as jest.MockedFunction<typeof isTypeSigner>;

describe('transactionHandlers/generic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sendTransaction uses ethers signer', async () => {
    mockedIsTypeSigner.mockReturnValue(true);
    const signer = createMockEthersSigner();
    const result = await GenericTxnHandler.sendTransaction({
      chainId: 42161,
      signer,
      from: '0x99BCEBf44433E901597D9fCb16E799a4847519f6',
      to: '0x0000000000000000000000000000000000000001',
      data: '0x',
      value: '0',
    });
    expect(signer.sendTransaction).toHaveBeenCalled();
    expect(result.status).toBe(TxnStatus.success);
    expect((result as { txnHash: string }).txnHash).toBe('0xabc123');
  });

  it('sendTransaction uses viem wallet client', async () => {
    mockedIsTypeSigner.mockReturnValue(false);
    const signer = createMockWalletClient();
    const result = await GenericTxnHandler.sendTransaction({
      chainId: 42161,
      signer,
      from: '0x99BCEBf44433E901597D9fCb16E799a4847519f6',
      to: '0x0000000000000000000000000000000000000001',
      data: '0x',
      value: '0',
    });
    expect(signer.sendTransaction).toHaveBeenCalled();
    expect(result.status).toBe(TxnStatus.success);
    expect((result as { txnHash: string }).txnHash).toBe('0xdef456');
  });

  it('sendTransaction handles errors via handleViemTransactionError', async () => {
    mockedIsTypeSigner.mockReturnValue(false);
    const signer = createMockWalletClient();
    (signer.sendTransaction as jest.Mock).mockRejectedValue(new Error('fail'));
    const result = await GenericTxnHandler.sendTransaction({
      chainId: 42161,
      signer,
      from: '0x99BCEBf44433E901597D9fCb16E799a4847519f6',
      to: '0x0000000000000000000000000000000000000001',
      data: '0x',
      value: '0',
    });
    expect(handleViemTransactionError).toHaveBeenCalled();
    expect(result.status).toBe('error');
  });
});
