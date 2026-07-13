import { isBatchTxnSupportedByWallet } from '../../../../src/utils/eip-5792/isBatchTxnSupportedByWallet';

jest.mock('viem/actions', () => ({
  getCapabilities: jest.fn(),
}));

jest.mock('viem/utils', () => ({
  getAction: jest.fn((_client, fn) => fn),
}));

import { getCapabilities } from 'viem/actions';

describe('utils/eip-5792/isBatchTxnSupportedByWallet', () => {
  const client = {} as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when atomicBatch is supported', async () => {
    (getCapabilities as jest.Mock).mockResolvedValue({ atomicBatch: { supported: true } });
    expect(await isBatchTxnSupportedByWallet({ client, chainId: 42161 })).toBe(true);
  });

  it('returns false when capabilities call fails', async () => {
    (getCapabilities as jest.Mock).mockRejectedValue(new Error('unsupported'));
    expect(await isBatchTxnSupportedByWallet({ client, chainId: 42161 })).toBe(false);
  });

  it('returns true when atomic status is ready', async () => {
    (getCapabilities as jest.Mock).mockResolvedValue({ atomic: { status: 'ready' } });
    expect(await isBatchTxnSupportedByWallet({ client, chainId: 42161 })).toBe(true);
  });
});
