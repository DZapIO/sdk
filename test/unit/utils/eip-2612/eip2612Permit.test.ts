jest.mock('../../../../src/utils/multicall', () => ({
  multicall: jest.fn(),
}));

jest.mock('../../../../src/utils/signTypedData', () => ({
  signTypedData: jest.fn(),
}));

jest.mock('../../../../src/config', () => ({
  config: {
    getEip2612DisabledChains: jest.fn().mockReturnValue([747474]),
  },
}));

import { multicall } from '../../../../src/utils/multicall';
import { signTypedData } from '../../../../src/utils/signTypedData';
import { checkEIP2612PermitSupport, getEIP2612PermitSignature } from '../../../../src/utils/eip-2612/eip2612Permit';
import { DEFAULT_PERMIT_VERSION } from '../../../../src/constants/permit2';
import { EIP2612_PERMIT_TYPEHASH } from '../../../../src/constants/permit';
import { ContractVersion, StatusCodes, TxnStatus } from '../../../../src/enums';
import { Services } from '../../../../src/constants';

const token = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
const owner = '0x99BCEBf44433E901597D9fCb16E799a4847519f6';

describe('utils/eip-2612/eip2612Permit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('checkEIP2612PermitSupport returns false for disabled chains', async () => {
    const result = await checkEIP2612PermitSupport({
      address: token,
      chainId: 747474,
      owner,
    });
    expect(result.supportsPermit).toBe(false);
  });

  it('checkEIP2612PermitSupport returns false when permit explicitly disabled', async () => {
    const result = await checkEIP2612PermitSupport({
      address: token,
      chainId: 42161,
      owner,
      permit: { eip2612: { supported: false } } as any,
    });
    expect(result.supportsPermit).toBe(false);
  });

  it('checkEIP2612PermitSupport returns false when multicall fails', async () => {
    (multicall as jest.Mock).mockResolvedValue({ status: TxnStatus.error });
    const result = await checkEIP2612PermitSupport({
      address: token,
      chainId: 42161,
      owner,
    });
    expect(result.supportsPermit).toBe(false);
  });

  it('checkEIP2612PermitSupport returns false when required multicall reads fail', async () => {
    (multicall as jest.Mock).mockResolvedValue({
      status: TxnStatus.success,
      data: [
        { status: TxnStatus.error, result: null },
        { status: TxnStatus.success, result: 5n },
        { status: TxnStatus.success, result: '1' },
        { status: TxnStatus.success, result: 'USD Coin' },
        { status: TxnStatus.success, result: EIP2612_PERMIT_TYPEHASH },
      ],
    });

    const result = await checkEIP2612PermitSupport({
      address: token,
      chainId: 42161,
      owner,
    });

    expect(result.supportsPermit).toBe(false);
  });

  it('checkEIP2612PermitSupport returns false when permit typehash mismatches', async () => {
    (multicall as jest.Mock).mockResolvedValue({
      status: TxnStatus.success,
      data: [
        { status: TxnStatus.success, result: '0xdomain' },
        { status: TxnStatus.success, result: 5n },
        { status: TxnStatus.success, result: '1' },
        { status: TxnStatus.success, result: 'USD Coin' },
        { status: TxnStatus.success, result: '0xdeadbeef' },
      ],
    });

    const result = await checkEIP2612PermitSupport({
      address: token,
      chainId: 42161,
      owner,
    });

    expect(result.supportsPermit).toBe(false);
  });

  it('checkEIP2612PermitSupport returns true with token metadata', async () => {
    (multicall as jest.Mock).mockResolvedValue({
      status: TxnStatus.success,
      data: [
        { status: TxnStatus.success, result: '0xdomain' },
        { status: TxnStatus.success, result: 5n },
        { status: TxnStatus.success, result: '1' },
        { status: TxnStatus.success, result: 'USD Coin' },
        { status: TxnStatus.success, result: EIP2612_PERMIT_TYPEHASH },
      ],
    });
    const result = await checkEIP2612PermitSupport({
      address: token,
      chainId: 42161,
      owner,
    });
    expect(result.supportsPermit).toBe(true);
    expect(result.data?.name).toBe('USD Coin');
    expect(result.data?.nonce).toBe(5n);
  });

  it('checkEIP2612PermitSupport falls back to default version when version read fails', async () => {
    (multicall as jest.Mock).mockResolvedValue({
      status: TxnStatus.success,
      data: [
        { status: TxnStatus.success, result: '0xdomain' },
        { status: TxnStatus.success, result: 5n },
        { status: TxnStatus.error, result: null },
        { status: TxnStatus.success, result: 'USD Coin' },
        { status: TxnStatus.error, result: null },
      ],
    });

    const result = await checkEIP2612PermitSupport({
      address: token,
      chainId: 42161,
      owner,
    });

    expect(result.supportsPermit).toBe(true);
    expect(result.data?.version).toBe(DEFAULT_PERMIT_VERSION);
  });

  it('getEIP2612PermitSignature returns encoded permit on success', async () => {
    (signTypedData as jest.Mock).mockResolvedValue(`0x${'a'.repeat(64)}${'b'.repeat(64)}1b`);
    const result = await getEIP2612PermitSignature({
      chainId: 42161,
      spender: '0x0000000000000000000000000000000000000001',
      account: owner,
      token: { address: token, amount: '1000', index: 0 },
      signer: {} as any,
      contractVersion: ContractVersion.v2,
      service: Services.trade,
      name: 'USD Coin',
      nonce: 1n,
      version: '1',
      deadline: 9999999999n,
      gasless: false,
    } as any);
    expect(result.status).toBe(TxnStatus.success);
    expect(result.permitData).toMatch(/^0x/);
  });

  it('getEIP2612PermitSignature uses token domain and max allowance when amount is omitted', async () => {
    const customDomain = {
      name: 'Custom Token',
      version: '2',
      chainId: 42161,
      verifyingContract: token,
    };

    (signTypedData as jest.Mock).mockResolvedValue(`0x${'a'.repeat(64)}${'b'.repeat(64)}1b`);
    const result = await getEIP2612PermitSignature({
      chainId: 42161,
      spender: '0x0000000000000000000000000000000000000001',
      account: owner,
      token: {
        address: token,
        index: 0,
        permit: { eip2612: { data: { domain: customDomain } } },
      },
      signer: {} as any,
      contractVersion: ContractVersion.v1,
      service: Services.trade,
      name: 'USD Coin',
      nonce: 1n,
      version: '1',
      deadline: 9999999999n,
      gasless: false,
    } as any);

    expect(result.status).toBe(TxnStatus.success);
    expect(signTypedData).toHaveBeenCalledWith(
      expect.objectContaining({
        domain: customDomain,
        message: expect.objectContaining({
          value: expect.anything(),
        }),
      }),
    );
  });

  it('getEIP2612PermitSignature handles user rejection from nested cause', async () => {
    (signTypedData as jest.Mock).mockRejectedValue({ cause: { code: StatusCodes.UserRejectedRequest } });
    const result = await getEIP2612PermitSignature({
      chainId: 42161,
      spender: '0x0000000000000000000000000000000000000001',
      account: owner,
      token: { address: token, amount: '1000', index: 0 },
      signer: {} as any,
      contractVersion: ContractVersion.v2,
      service: Services.trade,
      name: 'USD Coin',
      nonce: 1n,
      version: '1',
      gasless: false,
    } as any);
    expect(result.status).toBe(TxnStatus.rejected);
  });

  it('getEIP2612PermitSignature handles user rejection', async () => {
    (signTypedData as jest.Mock).mockRejectedValue({ code: StatusCodes.UserRejectedRequest });
    const result = await getEIP2612PermitSignature({
      chainId: 42161,
      spender: '0x0000000000000000000000000000000000000001',
      account: owner,
      token: { address: token, amount: '1000', index: 0 },
      signer: {} as any,
      contractVersion: ContractVersion.v2,
      service: Services.trade,
      name: 'USD Coin',
      nonce: 1n,
      version: '1',
      gasless: false,
    } as any);
    expect(result.status).toBe(TxnStatus.rejected);
  });

  it('getEIP2612PermitSignature handles generic signing errors', async () => {
    (signTypedData as jest.Mock).mockRejectedValue(new Error('signing failed'));
    const result = await getEIP2612PermitSignature({
      chainId: 42161,
      spender: '0x0000000000000000000000000000000000000001',
      account: owner,
      token: { address: token, amount: '1000', index: 0 },
      signer: {} as any,
      contractVersion: ContractVersion.v2,
      service: Services.trade,
      name: 'USD Coin',
      nonce: 1n,
      version: '1',
      gasless: false,
    } as any);
    expect(result.status).toBe(TxnStatus.error);
    expect(result.code).toBe(StatusCodes.Error);
  });
});
