jest.mock('../../../src/api', () => ({
  broadcastTradeTx: jest.fn(),
}));

jest.mock('../../../src/utils/signIntent/custom', () => ({
  signCustomTypedData: jest.fn(),
}));

import { HyperLiquidTxHandler } from '../../../src/transactionHandlers/hyperliquid';
import { broadcastTradeTx } from '../../../src/api';
import { signCustomTypedData } from '../../../src/utils/signIntent/custom';
import { TxnStatus, StatusCodes } from '../../../src/enums';
import { createMockEthersSigner } from '../../helpers/mocks/signer';

describe('transactionHandlers/hyperliquid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns error when signTypedData is missing', async () => {
    const result = await HyperLiquidTxHandler.sendTransaction(
      createMockEthersSigner(),
      '0x99BCEBf44433E901597D9fCb16E799a4847519f6',
      { transaction: {} } as any,
      1337,
      undefined,
      {},
    );
    expect(result.status).toBe(TxnStatus.error);
    expect(result.errorMsg).toContain('Missing typed data');
  });

  it('signs and broadcasts hyperliquid transaction', async () => {
    (signCustomTypedData as jest.Mock).mockResolvedValue({
      status: TxnStatus.success,
      data: { signature: '0xsig' },
    });
    (broadcastTradeTx as jest.Mock).mockResolvedValue({
      status: TxnStatus.success,
      txnHash: '0xhash',
    });

    const signer = createMockEthersSigner();
    const result = await HyperLiquidTxHandler.sendTransaction(
      signer,
      '0x99BCEBf44433E901597D9fCb16E799a4847519f6',
      {
        txId: 'tx-1',
        transaction: {
          signTypedData: [
            {
              domain: {},
              types: {},
              message: {},
              primaryType: 'Agent',
            },
          ],
        },
      } as any,
      1337,
      undefined,
      { key: 'val' },
    );

    expect(signCustomTypedData).toHaveBeenCalled();
    expect(broadcastTradeTx).toHaveBeenCalled();
    expect(result.status).toBe(TxnStatus.success);
    expect(result.txnHash).toBe('0xhash');
  });
});
