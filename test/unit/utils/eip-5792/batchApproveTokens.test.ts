jest.mock('../../../../src/utils/erc20', () => ({
  getAllowance: jest.fn(),
}));

jest.mock('../../../../src/utils/eip-5792/sendBatchCalls', () => ({
  sendBatchCalls: jest.fn(),
}));

import { generateApprovalBatchCalls, batchApproveTokens } from '../../../../src/utils/eip-5792/batchApproveTokens';
import { getAllowance } from '../../../../src/utils/erc20';
import { sendBatchCalls } from '../../../../src/utils/eip-5792/sendBatchCalls';
import { dZapNativeTokenFormat } from '../../../../src/constants';
import { AllowanceTypes } from '../../../../src/types/permit';
import { createMockWalletClient } from '../../../helpers/mocks/signer';
import { arbitrumOne, arbitrumUsdc, sampleAccounts } from '../../../fixtures/realWorld';

describe('utils/eip-5792/batchApproveTokens', () => {
  const sender = sampleAccounts.testWallet;
  const spender = sampleAccounts.zeroLike;
  const erc20 = arbitrumUsdc.address;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generateApprovalBatchCalls returns empty for native-only tokens', async () => {
    const calls = await generateApprovalBatchCalls({
      tokens: [{ address: dZapNativeTokenFormat, amount: '100' }],
      chainId: arbitrumOne.chainId,
      sender,
      spender,
    });
    expect(calls).toEqual([]);
    expect(getAllowance).not.toHaveBeenCalled();
  });

  it('generateApprovalBatchCalls skips tokens with sufficient allowance', async () => {
    (getAllowance as jest.Mock).mockResolvedValue({
      data: {
        [erc20]: { allowance: 1000n, type: AllowanceTypes.dzap },
      },
    });
    const calls = await generateApprovalBatchCalls({
      tokens: [{ address: erc20, amount: '100' }],
      chainId: arbitrumOne.chainId,
      sender,
      spender,
    });
    expect(calls).toEqual([]);
  });

  it('generateApprovalBatchCalls skips eip2612 allowance type', async () => {
    (getAllowance as jest.Mock).mockResolvedValue({
      data: {
        [erc20]: { allowance: 0n, type: AllowanceTypes.eip2612 },
      },
    });
    const calls = await generateApprovalBatchCalls({
      tokens: [{ address: erc20, amount: '100' }],
      chainId: arbitrumOne.chainId,
      sender,
      spender,
    });
    expect(calls).toEqual([]);
  });

  it('generateApprovalBatchCalls returns approve calls when allowance is low', async () => {
    (getAllowance as jest.Mock).mockResolvedValue({
      data: {
        [erc20]: { allowance: 0n, type: AllowanceTypes.dzap },
      },
    });
    const calls = await generateApprovalBatchCalls({
      tokens: [{ address: erc20, amount: '100' }],
      chainId: arbitrumOne.chainId,
      sender,
      spender,
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].to).toBe(erc20);
    expect(calls[0].data).toMatch(/^0x/);
  });

  it('batchApproveTokens returns success when no approvals needed', async () => {
    (getAllowance as jest.Mock).mockResolvedValue({
      data: {
        [erc20]: { allowance: 1000n, type: AllowanceTypes.dzap },
      },
    });
    const result = await batchApproveTokens(createMockWalletClient(), [{ address: erc20, amount: '1' }], arbitrumOne.chainId, spender, sender);
    expect(result.success).toBe(true);
    expect(sendBatchCalls).not.toHaveBeenCalled();
  });

  it('batchApproveTokens sends batch when approvals are required', async () => {
    (getAllowance as jest.Mock).mockResolvedValue({
      data: { [erc20]: { allowance: 0n, type: AllowanceTypes.dzap } },
    });
    (sendBatchCalls as jest.Mock).mockResolvedValue({ id: '0xbatch' });
    const result = await batchApproveTokens(createMockWalletClient(), [{ address: erc20, amount: '1' }], arbitrumOne.chainId, spender, sender);
    expect(sendBatchCalls).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.batchId).toBe('0xbatch');
  });
});
