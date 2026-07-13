jest.mock('../../../../src/utils/signTypedData', () => ({
  signTypedData: jest.fn(),
}));

jest.mock('../../../../src/utils/permit2/values', () => ({
  getPermit2Values: jest.fn(),
}));

jest.mock('../../../../src/utils/permit2/witnessData', () => ({
  getPermit2WitnessData: jest.fn(),
}));

import { maxUint48, maxUint256 } from 'viem';
import { signTypedData } from '../../../../src/utils/signTypedData';
import { getPermit2Values } from '../../../../src/utils/permit2/values';
import { getPermit2WitnessData } from '../../../../src/utils/permit2/witnessData';
import { getPermit2Address, getPermit2Signature } from '../../../../src/utils/permit2';
import { permit2PrimaryType } from '../../../../src/constants/permit';
import { ContractVersion, StatusCodes, TxnStatus } from '../../../../src/enums';
import { Services } from '../../../../src/constants';
import type { Permit2Params } from '../../../../src/types/permit';

import type { HexString } from '../../../../src/types';

describe('utils/permit2/index', () => {
  const account = '0x99BCEBf44433E901597D9fCb16E799a4847519f6' as HexString;
  const spender = '0x0000000000000000000000000000000000000001' as HexString;
  const token = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as HexString;
  const token2 = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as HexString;
  const signature = `0x${'a'.repeat(64)}${'b'.repeat(64)}1b`;
  const deadline = BigInt(4_000_000_000);
  const nonce = BigInt(3);

  const witnessData = {
    witness: { owner: account, recipient: spender },
    witnessTypeName: 'DZapTransferWitness',
    witnessType: { DZapTransferWitness: [{ name: 'owner', type: 'address' }] },
  };

  const baseParams = {
    chainId: 42161,
    account,
    tokens: [{ address: token, amount: '1000', index: 0 }],
    spender,
    signer: {} as Permit2Params['signer'],
    contractVersion: ContractVersion.v2,
    service: Services.trade,
    gasless: false as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getPermit2WitnessData as jest.Mock).mockReturnValue({ witnessData });
    (signTypedData as jest.Mock).mockResolvedValue(signature);
  });

  it('getPermit2Address returns default address for unknown chain', () => {
    expect(getPermit2Address(99999)).toBe('0x000000000022D473030F116dDEE9F6B43aC78BA3');
  });

  it('getPermit2Address returns chain-specific address when configured', () => {
    expect(getPermit2Address(42161)).toBeTruthy();
  });

  it('getPermit2Signature returns permit data for witness transfer', async () => {
    (getPermit2Values as jest.Mock).mockResolvedValue({
      permit2Values: {
        permitted: { token, amount: 1000n },
        spender,
        nonce,
        deadline,
      },
      nonce,
    });

    const result = await getPermit2Signature({
      ...baseParams,
      permitType: permit2PrimaryType.PermitWitnessTransferFrom,
      firstTokenNonce: 5n,
      expiration: maxUint48,
      deadline,
    });

    expect(getPermit2Values).toHaveBeenCalledWith(
      expect.objectContaining({
        firstTokenNonce: 5n,
        service: Services.trade,
        contractVersion: ContractVersion.v2,
        expiration: maxUint48,
        deadline,
      }),
    );
    expect(result.status).toBe(TxnStatus.success);
    expect(result.permitData).toMatch(/^0x/);
    expect(result.nonce).toBe(nonce);
  });

  it('getPermit2Signature encodes batch witness transfer permits', async () => {
    (getPermit2Values as jest.Mock).mockResolvedValue({
      permit2Values: {
        permitted: [
          { token, amount: 1000n },
          { token: token2, amount: 2000n },
        ],
        spender,
        nonce,
        deadline,
      },
      nonce,
    });

    const result = await getPermit2Signature({
      ...baseParams,
      tokens: [
        { address: token, amount: '1000', index: 0 },
        { address: token2, amount: '2000', index: 1 },
      ],
      permitType: permit2PrimaryType.PermitBatchWitnessTransferFrom,
    });

    expect(result.status).toBe(TxnStatus.success);
    expect(result.permitData).toMatch(/^0x/);
    expect(result.nonce).toBe(nonce);
  });

  it('getPermit2Signature encodes v1 approve permits', async () => {
    (getPermit2Values as jest.Mock).mockResolvedValue({
      permit2Values: {
        details: {
          token,
          amount: 1000n,
          expiration: maxUint48,
          nonce: 0,
        },
        spender,
        sigDeadline: deadline,
      },
      nonce,
    });

    const result = await getPermit2Signature({
      ...baseParams,
      contractVersion: ContractVersion.v1,
      permitType: permit2PrimaryType.PermitSingle,
    });

    expect(result.status).toBe(TxnStatus.success);
    expect(result.permitData).toMatch(/^0x/);
  });

  it('getPermit2Signature encodes default v2 permit single data', async () => {
    (getPermit2Values as jest.Mock).mockResolvedValue({
      permit2Values: {
        details: {
          token,
          amount: 1000n,
          expiration: maxUint48,
          nonce: 0,
        },
        spender,
        sigDeadline: deadline,
      },
      nonce,
    });

    const result = await getPermit2Signature({
      ...baseParams,
      contractVersion: ContractVersion.v2,
      service: Services.zap,
      permitType: permit2PrimaryType.PermitSingle,
    });

    expect(result.status).toBe(TxnStatus.success);
    expect(result.permitData).toMatch(/^0x/);
  });

  it('getPermit2Signature defaults missing token amount to max uint256', async () => {
    (getPermit2Values as jest.Mock).mockResolvedValue({
      permit2Values: {
        permitted: { token, amount: maxUint256 },
        spender,
        nonce,
        deadline,
      },
      nonce,
    });

    await getPermit2Signature({
      ...baseParams,
      tokens: [{ address: token, amount: '', index: 0 }],
      permitType: permit2PrimaryType.PermitWitnessTransferFrom,
      firstTokenNonce: undefined,
    });

    expect(getPermit2Values).toHaveBeenCalledWith(
      expect.objectContaining({
        firstTokenNonce: null,
        tokens: [{ address: token, amount: maxUint256.toString(), index: 0 }],
      }),
    );
  });

  it('getPermit2Signature handles user rejection from getPermit2Values', async () => {
    (getPermit2Values as jest.Mock).mockRejectedValue({ code: StatusCodes.UserRejectedRequest });

    const result = await getPermit2Signature({
      ...baseParams,
      permitType: permit2PrimaryType.PermitWitnessTransferFrom,
    });

    expect(result.status).toBe(TxnStatus.rejected);
    expect(result.code).toBe(StatusCodes.UserRejectedRequest);
  });

  it('getPermit2Signature handles user rejection from signTypedData', async () => {
    (getPermit2Values as jest.Mock).mockResolvedValue({
      permit2Values: {
        permitted: { token, amount: 1000n },
        spender,
        nonce,
        deadline,
      },
      nonce,
    });
    (signTypedData as jest.Mock).mockRejectedValue({ cause: { code: StatusCodes.UserRejectedRequest } });

    const result = await getPermit2Signature({
      ...baseParams,
      permitType: permit2PrimaryType.PermitWitnessTransferFrom,
    });

    expect(result.status).toBe(TxnStatus.rejected);
  });

  it('getPermit2Signature handles unexpected errors', async () => {
    (getPermit2Values as jest.Mock).mockRejectedValue(new Error('rpc failed'));

    const result = await getPermit2Signature({
      ...baseParams,
      permitType: permit2PrimaryType.PermitWitnessTransferFrom,
    });

    expect(result.status).toBe(TxnStatus.error);
    expect(result.code).toBe(StatusCodes.Error);
  });
});
