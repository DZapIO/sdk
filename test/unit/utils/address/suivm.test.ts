jest.mock('axios');

import axios from 'axios';
import { classifySuivmAddress } from '../../../../src/utils/address/suivm';
import { mockChainConfig } from '../../../fixtures/chainConfig';
import { AddressKind } from '../../../../src/types/address';
import { exclusiveChainIds } from '../../../../src/constants/chains';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('utils/address/suivm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns NATIVE for native coin type', async () => {
    const result = await classifySuivmAddress({
      address: '0x2::sui::SUI',
      chainId: exclusiveChainIds.sui,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.NATIVE);
  });

  it('returns TOKEN for move coin type string', async () => {
    const result = await classifySuivmAddress({
      address: '0x2::coin::USDC',
      chainId: exclusiveChainIds.sui,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.TOKEN);
  });

  it('returns INVALID for malformed account address', async () => {
    const result = await classifySuivmAddress({
      address: 'not-valid-sui',
      chainId: exclusiveChainIds.sui,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.INVALID);
  });

  it('returns CONTRACT for package object', async () => {
    mockedAxios.post.mockResolvedValue({
      status: 200,
      data: { result: { data: { type: 'package' } } },
    });
    const result = await classifySuivmAddress({
      address: '0xabc123',
      chainId: exclusiveChainIds.sui,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.CONTRACT);
  });

  it('returns WALLET for non-package object', async () => {
    mockedAxios.post.mockResolvedValue({
      status: 200,
      data: { result: { data: { type: 'account' } } },
    });
    const result = await classifySuivmAddress({
      address: '0xabc123',
      chainId: exclusiveChainIds.sui,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.WALLET);
  });

  it('returns null on RPC error response', async () => {
    mockedAxios.post.mockResolvedValue({
      status: 200,
      data: { error: { message: 'fail' } },
    });
    const result = await classifySuivmAddress({
      address: '0xabc123',
      chainId: exclusiveChainIds.sui,
      chainConfig: mockChainConfig,
    });
    expect(result).toBeNull();
  });

  it('returns CONTRACT when package is identified by dataType', async () => {
    mockedAxios.post.mockResolvedValue({
      status: 200,
      data: { result: { data: { dataType: 'package' } } },
    });
    const result = await classifySuivmAddress({
      address: '0xabc123',
      chainId: exclusiveChainIds.sui,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.CONTRACT);
  });

  it('returns null on RPC network error', async () => {
    mockedAxios.post.mockRejectedValue(new Error('network'));
    const result = await classifySuivmAddress({
      address: '0xabc123',
      chainId: exclusiveChainIds.sui,
      chainConfig: mockChainConfig,
    });
    expect(result).toBeNull();
  });

  it('returns null when RPC throws a non-error value', async () => {
    mockedAxios.post.mockRejectedValue('network');
    const result = await classifySuivmAddress({
      address: '0xabc123',
      chainId: exclusiveChainIds.sui,
      chainConfig: mockChainConfig,
    });
    expect(result).toBeNull();
  });
});
