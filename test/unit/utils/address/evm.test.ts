jest.mock('../../../../src/utils', () => {
  const actual = jest.requireActual('../../../../src/utils');
  return {
    ...actual,
    getPublicClient: jest.fn(),
  };
});

import { getPublicClient } from '../../../../src/utils';
import { classifyEvmAddress } from '../../../../src/utils/address/evm';
import { mockChainConfig } from '../../../fixtures/chainConfig';
import { AddressKind } from '../../../../src/types/address';

const mockedGetPublicClient = getPublicClient as jest.MockedFunction<typeof getPublicClient>;

describe('utils/address/evm', () => {
  const wallet = '0x99BCEBf44433E901597D9fCb16E799a4847519f6';
  const token = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns INVALID for non-address input', async () => {
    const result = await classifyEvmAddress({
      address: 'not-an-address',
      chainId: 42161,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.INVALID);
  });

  it('returns NATIVE for native token contract', async () => {
    const result = await classifyEvmAddress({
      address: '0x0000000000000000000000000000000000000000',
      chainId: 42161,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.NATIVE);
    expect(result?.isNative).toBe(true);
  });

  it('returns null when getCode RPC fails', async () => {
    mockedGetPublicClient.mockReturnValue({
      getCode: jest.fn().mockRejectedValue(new Error('rpc down')),
      readContract: jest.fn(),
    } as any);
    const result = await classifyEvmAddress({
      address: wallet,
      chainId: 42161,
      chainConfig: mockChainConfig,
    });
    expect(result).toBeNull();
  });

  it('returns null when getCode throws a non-error value', async () => {
    mockedGetPublicClient.mockReturnValue({
      getCode: jest.fn().mockRejectedValue('rpc down'),
      readContract: jest.fn(),
    } as any);
    const result = await classifyEvmAddress({
      address: wallet,
      chainId: 42161,
      chainConfig: mockChainConfig,
    });
    expect(result).toBeNull();
  });

  it('returns WALLET for EOA with no bytecode', async () => {
    mockedGetPublicClient.mockReturnValue({
      getCode: jest.fn().mockResolvedValue('0x'),
      readContract: jest.fn(),
    } as any);
    const result = await classifyEvmAddress({
      address: wallet,
      chainId: 42161,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.WALLET);
  });

  it('returns WALLET for EIP-7702 delegation bytecode', async () => {
    const eip7702Code = `0xef0100${'00'.repeat(20)}`;
    mockedGetPublicClient.mockReturnValue({
      getCode: jest.fn().mockResolvedValue(eip7702Code),
      readContract: jest.fn(),
    } as any);
    const result = await classifyEvmAddress({
      address: wallet,
      chainId: 42161,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.WALLET);
  });

  it('returns TOKEN when contract exposes decimals()', async () => {
    mockedGetPublicClient.mockReturnValue({
      getCode: jest.fn().mockResolvedValue('0x1234'),
      readContract: jest.fn().mockResolvedValue(18),
    } as any);
    const result = await classifyEvmAddress({
      address: token,
      chainId: 42161,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.TOKEN);
    expect(result?.isContract).toBe(true);
  });

  it('returns CONTRACT when decimals() reverts', async () => {
    mockedGetPublicClient.mockReturnValue({
      getCode: jest.fn().mockResolvedValue('0x1234'),
      readContract: jest.fn().mockRejectedValue(new Error('revert')),
    } as any);
    const result = await classifyEvmAddress({
      address: token,
      chainId: 42161,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.CONTRACT);
  });
});
