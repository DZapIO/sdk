jest.mock('axios');

import axios from 'axios';
import { classifyTronvmAddress } from '../../../../src/utils/address/tronvm';
import { mockChainConfig } from '../../../fixtures/chainConfig';
import { AddressKind } from '../../../../src/types/address';
import { exclusiveChainIds } from '../../../../src/constants/chains';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('utils/address/tronvm', () => {
  const wallet = 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns INVALID for malformed tron address', async () => {
    const result = await classifyTronvmAddress({
      address: '0xnot-tron',
      chainId: exclusiveChainIds.tron,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.INVALID);
  });

  it('returns NATIVE for native tron address', async () => {
    const result = await classifyTronvmAddress({
      address: wallet,
      chainId: exclusiveChainIds.tron,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.NATIVE);
  });

  it('returns WALLET for EOA without bytecode', async () => {
    mockedAxios.post.mockResolvedValue({ status: 200, data: {} });
    const result = await classifyTronvmAddress({
      address: 'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7',
      chainId: exclusiveChainIds.tron,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.WALLET);
  });

  it('returns TOKEN for TRC-20 contract with decimals', async () => {
    mockedAxios.post.mockResolvedValue({
      status: 200,
      data: {
        bytecode: '0x608060',
        abi: { entrys: [{ name: 'decimals' }, { name: 'transfer' }] },
      },
    });
    const result = await classifyTronvmAddress({
      address: 'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7',
      chainId: exclusiveChainIds.tron,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.TOKEN);
    expect(result?.isToken).toBe(true);
  });

  it('returns CONTRACT for non-token contract', async () => {
    mockedAxios.post.mockResolvedValue({
      status: 200,
      data: {
        bytecode: '0x608060',
        abi: { entrys: [{ name: 'foo' }] },
      },
    });
    const result = await classifyTronvmAddress({
      address: 'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7',
      chainId: exclusiveChainIds.tron,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.CONTRACT);
  });

  it('returns null on RPC error', async () => {
    mockedAxios.post.mockRejectedValue(new Error('network'));
    const result = await classifyTronvmAddress({
      address: 'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7',
      chainId: exclusiveChainIds.tron,
      chainConfig: mockChainConfig,
    });
    expect(result).toBeNull();
  });

  it('returns null when RPC throws a non-error value', async () => {
    mockedAxios.post.mockRejectedValue('network');
    const result = await classifyTronvmAddress({
      address: 'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7',
      chainId: exclusiveChainIds.tron,
      chainConfig: mockChainConfig,
    });
    expect(result).toBeNull();
  });

  it('returns CONTRACT for contract without abi metadata', async () => {
    mockedAxios.post.mockResolvedValue({
      status: 200,
      data: {
        bytecode: '0x608060',
      },
    });
    const result = await classifyTronvmAddress({
      address: 'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7',
      chainId: exclusiveChainIds.tron,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.CONTRACT);
  });

  it('returns null when trongrid responds with an error payload', async () => {
    mockedAxios.post.mockResolvedValue({
      status: 200,
      data: { error: 'contract not found' },
    });
    const result = await classifyTronvmAddress({
      address: 'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7',
      chainId: exclusiveChainIds.tron,
      chainConfig: mockChainConfig,
    });
    expect(result).toBeNull();
  });
});
