jest.mock('axios');

import axios from 'axios';
import { classifyAptosvmAddress } from '../../../../src/utils/address/aptosvm';
import { mockChainConfig } from '../../../fixtures/chainConfig';
import { AddressKind } from '../../../../src/types/address';
import { exclusiveChainIds } from '../../../../src/constants/chains';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('utils/address/aptosvm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns NATIVE for aptos native coin type', async () => {
    const result = await classifyAptosvmAddress({
      address: '0x1::aptos_coin::AptosCoin',
      chainId: exclusiveChainIds.aptos,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.NATIVE);
  });

  it('returns TOKEN for move coin type', async () => {
    const result = await classifyAptosvmAddress({
      address: '0x1::coin::USDC',
      chainId: exclusiveChainIds.aptos,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.TOKEN);
  });

  it('returns INVALID for malformed address', async () => {
    const result = await classifyAptosvmAddress({
      address: 'bad',
      chainId: exclusiveChainIds.aptos,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.INVALID);
  });

  it('returns CONTRACT when account has published modules', async () => {
    mockedAxios.get.mockResolvedValue({ status: 200, data: [{ bytecode: '0x01' }] });
    const result = await classifyAptosvmAddress({
      address: '0xabc',
      chainId: exclusiveChainIds.aptos,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.CONTRACT);
  });

  it('returns WALLET for funded account without modules', async () => {
    mockedAxios.get.mockResolvedValue({ status: 200, data: [] });
    const result = await classifyAptosvmAddress({
      address: '0xabc',
      chainId: exclusiveChainIds.aptos,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.WALLET);
  });

  it('returns WALLET for unfunded account (404)', async () => {
    mockedAxios.get.mockResolvedValue({ status: 404, data: null });
    const result = await classifyAptosvmAddress({
      address: '0xabc',
      chainId: exclusiveChainIds.aptos,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.WALLET);
  });

  it('returns null on unexpected status', async () => {
    mockedAxios.get.mockResolvedValue({ status: 500, data: null });
    const result = await classifyAptosvmAddress({
      address: '0xabc',
      chainId: exclusiveChainIds.aptos,
      chainConfig: mockChainConfig,
    });
    expect(result).toBeNull();
  });

  it('uses custom rpc url when provided', async () => {
    mockedAxios.get.mockImplementation((_url, config) => {
      expect(config?.validateStatus?.(404)).toBe(true);
      expect(config?.validateStatus?.(500)).toBe(false);
      return Promise.resolve({ status: 200, data: [] });
    });
    await classifyAptosvmAddress({
      address: '0xabc',
      chainId: exclusiveChainIds.aptos,
      chainConfig: mockChainConfig,
      rpcUrls: ['https://aptos.example.com/'],
    });
    expect(mockedAxios.get).toHaveBeenCalledWith('https://aptos.example.com/v1/accounts/0xabc/modules', {
      params: { limit: 1 },
      validateStatus: expect.any(Function),
    });
  });

  it('returns null on RPC network error', async () => {
    mockedAxios.get.mockRejectedValue(new Error('network'));
    const result = await classifyAptosvmAddress({
      address: '0xabc',
      chainId: exclusiveChainIds.aptos,
      chainConfig: mockChainConfig,
    });
    expect(result).toBeNull();
  });

  it('returns null when RPC throws a non-error value', async () => {
    mockedAxios.get.mockRejectedValue('network');
    const result = await classifyAptosvmAddress({
      address: '0xabc',
      chainId: exclusiveChainIds.aptos,
      chainConfig: mockChainConfig,
    });
    expect(result).toBeNull();
  });
});
