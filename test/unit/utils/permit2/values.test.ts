jest.mock('../../../../src/utils', () => {
  const actual = jest.requireActual('../../../../src/utils');
  return {
    ...actual,
    getPublicClient: jest.fn(),
  };
});

jest.mock('../../../../src/utils/permit2/nonce', () => ({
  getNextPermit2Nonce: jest.fn(),
}));

import { getPublicClient } from '../../../../src/utils';
import { getNextPermit2Nonce } from '../../../../src/utils/permit2/nonce';
import {
  getPermitSingleValues,
  getPermitTransferFromValues,
  getPermitBatchTransferFromValues,
  getPermit2Values,
} from '../../../../src/utils/permit2/values';
import { permit2PrimaryType } from '../../../../src/constants/permit';

const mockedReadContract = jest.fn();
const mockedGetPublicClient = getPublicClient as jest.MockedFunction<typeof getPublicClient>;

describe('utils/permit2/values', () => {
  const permit2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
  const account = '0x99BCEBf44433E901597D9fCb16E799a4847519f6';
  const spender = '0x0000000000000000000000000000000000000001';
  const token = { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as const, amount: '1000', index: 0 };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetPublicClient.mockReturnValue({ readContract: mockedReadContract } as any);
  });

  it('getPermitSingleValues reads allowance nonce from permit2', async () => {
    mockedReadContract.mockResolvedValue([1000n, 9999999999n, 3]);
    const result = await getPermitSingleValues({
      spender,
      deadline: 9999999999n,
      chainId: 42161,
      account,
      expiration: 9999999999n,
      token,
      permit2Address: permit2,
    });
    expect(result.nonce).toBe(3n);
    expect(result.permit2Values.details.token).toBe(token.address);
  });

  it('getPermitTransferFromValues uses next nonce for first token', async () => {
    (getNextPermit2Nonce as jest.Mock).mockResolvedValue(10n);
    const result = await getPermitTransferFromValues({
      spender,
      deadline: 9999999999n,
      chainId: 42161,
      account,
      token,
      permit2Address: permit2,
      firstTokenNonce: null,
    });
    expect(result.nonce).toBe(10n);
  });

  it('getPermitTransferFromValues increments nonce for subsequent tokens', async () => {
    const result = await getPermitTransferFromValues({
      spender,
      deadline: 9999999999n,
      chainId: 42161,
      account,
      token: { ...token, index: 2 },
      permit2Address: permit2,
      firstTokenNonce: 10n,
    });
    expect(result.nonce).toBe(12n);
  });

  it('getPermitTransferFromValues throws when follow-up token lacks first nonce', async () => {
    await expect(
      getPermitTransferFromValues({
        spender,
        deadline: 9999999999n,
        chainId: 42161,
        account,
        token: { ...token, index: 1 },
        permit2Address: permit2,
        firstTokenNonce: null,
      }),
    ).rejects.toThrow('Unable to find nonce');
  });

  it('getPermitBatchTransferFromValues builds batch permit payload', async () => {
    (getNextPermit2Nonce as jest.Mock).mockResolvedValue(4n);
    const result = await getPermitBatchTransferFromValues({
      spender,
      deadline: 9999999999n,
      chainId: 42161,
      account,
      permit2Address: permit2,
      tokens: [token, { ...token, index: 1, address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' }],
    });
    expect(result.permit2Values.permitted).toHaveLength(2);
    expect(result.nonce).toBe(4n);
  });

  it('getPermit2Values routes by primary type', async () => {
    mockedReadContract.mockResolvedValue([1000n, 9999999999n, 1]);
    const single = await getPermit2Values({
      primaryType: permit2PrimaryType.PermitSingle,
      spender,
      account,
      deadline: 9999999999n,
      chainId: 42161,
      permit2Address: permit2,
      tokens: [token],
      expiration: 9999999999n,
      firstTokenNonce: null,
      service: 'trade' as any,
      contractVersion: 'v2' as any,
    });
    expect(single.permit2Values).toHaveProperty('details');

    (getNextPermit2Nonce as jest.Mock).mockResolvedValue(2n);
    const witness = await getPermit2Values({
      primaryType: permit2PrimaryType.PermitWitnessTransferFrom,
      spender,
      account,
      deadline: 9999999999n,
      chainId: 42161,
      permit2Address: permit2,
      tokens: [token],
      firstTokenNonce: null,
      service: 'trade' as any,
      contractVersion: 'v2' as any,
    });
    expect(witness.permit2Values).toHaveProperty('permitted');
  });
});
