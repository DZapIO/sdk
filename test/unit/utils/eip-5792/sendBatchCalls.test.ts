jest.mock('viem/actions', () => ({
  sendCalls: jest.fn(),
}));

jest.mock('viem/utils', () => ({
  getAction: jest.fn((client, fn) => (params: unknown) => fn(client, params)),
}));

import { arbitrum } from 'viem/chains';
import { sendCalls } from 'viem/actions';
import { getAction } from 'viem/utils';
import type { WalletClient } from 'viem';
import { sendBatchCalls } from '../../../../src/utils/eip-5792/sendBatchCalls';
import { encodeApproveCallData } from '../../../../src/utils/encodeApproveCall';
import { arbitrumUsdc, arbitrumWeth, permit2, sampleAccounts } from '../../../fixtures/realWorld';
import { createMockWalletClient } from '../../../helpers/mocks/signer';

describe('utils/eip-5792/sendBatchCalls', () => {
  /** Realistic EIP-5792 batch id shape returned by wallets supporting wallet_sendCalls */
  const batchId = '0xde0b295669a9cb93d6339855c10daea6790bee948538fe66ac825bec7ebea765';

  const usdcApproveCalldata = encodeApproveCallData({
    spender: permit2.defaultAddress,
    amount: BigInt(1_000_000), // 1 USDC
  });

  const wethApproveCalldata = encodeApproveCallData({
    spender: permit2.defaultAddress,
    amount: BigInt('1000000000000000000'), // 1 WETH
  });

  const walletClient = {
    ...createMockWalletClient(),
    account: { address: sampleAccounts.testWallet },
    chain: arbitrum,
    uid: 'dzap-test-wallet-client',
  } as unknown as WalletClient;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends a batch of real Arbitrum USDC approve calls via sendCalls', async () => {
    (sendCalls as jest.Mock).mockResolvedValue({ id: batchId });

    const result = await sendBatchCalls(walletClient, [{ to: arbitrumUsdc.address, data: usdcApproveCalldata }]);

    expect(getAction).toHaveBeenCalledWith(walletClient, sendCalls, 'sendCalls');
    expect(sendCalls).toHaveBeenCalledWith(walletClient, {
      account: walletClient.account,
      calls: [
        {
          to: arbitrumUsdc.address,
          data: usdcApproveCalldata,
          value: BigInt(0),
        },
      ],
    });
    expect(result).toEqual({ id: batchId });
  });

  it('defaults missing value to zero for ERC-20 approve batches', async () => {
    (sendCalls as jest.Mock).mockResolvedValue({ id: batchId });

    await sendBatchCalls(walletClient, [{ to: arbitrumUsdc.address, data: usdcApproveCalldata }]);

    expect(sendCalls).toHaveBeenCalledWith(
      walletClient,
      expect.objectContaining({
        calls: [expect.objectContaining({ value: BigInt(0) })],
      }),
    );
  });

  it('forwards explicit value for native-value batch calls', async () => {
    (sendCalls as jest.Mock).mockResolvedValue({ id: batchId });
    const ethValue = BigInt('100000000000000000'); // 0.1 ETH

    await sendBatchCalls(walletClient, [
      {
        to: sampleAccounts.zeroLike,
        data: '0x',
        value: ethValue,
      },
    ]);

    expect(sendCalls).toHaveBeenCalledWith(walletClient, {
      account: walletClient.account,
      calls: [{ to: sampleAccounts.zeroLike, data: '0x', value: ethValue }],
    });
  });

  it('sends multi-token approve batch with real Arbitrum USDC and WETH', async () => {
    (sendCalls as jest.Mock).mockResolvedValue({ id: batchId });

    const result = await sendBatchCalls(walletClient, [
      { to: arbitrumUsdc.address, data: usdcApproveCalldata, value: BigInt(0) },
      { to: arbitrumWeth.address, data: wethApproveCalldata, value: BigInt(0) },
    ]);

    expect(sendCalls).toHaveBeenCalledWith(walletClient, {
      account: walletClient.account,
      calls: [
        { to: arbitrumUsdc.address, data: usdcApproveCalldata, value: BigInt(0) },
        { to: arbitrumWeth.address, data: wethApproveCalldata, value: BigInt(0) },
      ],
    });
    expect(result?.id).toBe(batchId);
  });

  it('returns null when wallet does not support EIP-5792 sendCalls', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    (sendCalls as jest.Mock).mockRejectedValue(new Error('Method not found: wallet_sendCalls'));

    const result = await sendBatchCalls(walletClient, [{ to: arbitrumUsdc.address, data: usdcApproveCalldata }]);

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith('EIP-5792 batch calls not supported:', expect.any(Error));
    warnSpy.mockRestore();
  });
});
