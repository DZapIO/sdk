jest.mock('axios');

import axios from 'axios';
import { classifyTonvmAddress } from '../../../../src/utils/address/tonvm';
import { mockChainConfig } from '../../../fixtures/chainConfig';
import { AddressKind } from '../../../../src/types/address';
import { exclusiveChainIds } from '../../../../src/constants/chains';
import { tonNativeToken } from '../../../../src/constants/address';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('utils/address/tonvm', () => {
  const tonWallet = 'UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ';
  const usdtJettonMaster = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
  const customRpc = 'https://ton.example.com/api/v2';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns INVALID for malformed TON address', async () => {
    const result = await classifyTonvmAddress({
      address: '0xnot-ton',
      chainId: exclusiveChainIds.ton,
      chainConfig: mockChainConfig,
    });

    expect(result).toEqual({
      valid: false,
      kind: AddressKind.INVALID,
      isNative: false,
      isToken: false,
      isContract: false,
      address: '0xnot-ton',
    });
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('returns NATIVE for TON native token address', async () => {
    const result = await classifyTonvmAddress({
      address: tonNativeToken,
      chainId: exclusiveChainIds.ton,
      chainConfig: mockChainConfig,
    });

    expect(result).toEqual({
      valid: true,
      kind: AddressKind.NATIVE,
      isNative: true,
      isToken: true,
      isContract: false,
      address: tonNativeToken,
    });
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('returns WALLET for active wallet without contract code', async () => {
    mockedAxios.get.mockResolvedValue({
      status: 200,
      data: {
        ok: true,
        result: {
          balance: '1000000000',
          state: 'active',
        },
      },
    });

    const result = await classifyTonvmAddress({
      address: tonWallet,
      chainId: exclusiveChainIds.ton,
      chainConfig: mockChainConfig,
    });

    expect(mockedAxios.get).toHaveBeenCalledWith('https://toncenter.com/api/v2/getAddressInformation', {
      params: { address: tonWallet },
    });
    expect(result).toEqual({
      valid: true,
      kind: AddressKind.WALLET,
      isNative: false,
      isToken: false,
      isContract: false,
      address: tonWallet,
    });
  });

  it('returns TOKEN for Jetton master contract', async () => {
    mockedAxios.get.mockResolvedValue({
      status: 200,
      data: {
        ok: true,
        result: {
          balance: '0',
          code: 'te6cckEBAQEA...',
          state: 'active',
        },
      },
    });
    mockedAxios.post.mockImplementation((_url, _body, config) => {
      expect(config?.validateStatus?.(404)).toBe(true);
      return Promise.resolve({
        status: 200,
        data: {
          ok: true,
          result: { exit_code: 0 },
        },
      });
    });

    const result = await classifyTonvmAddress({
      address: usdtJettonMaster,
      chainId: exclusiveChainIds.ton,
      chainConfig: mockChainConfig,
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://toncenter.com/api/v2/runGetMethod',
      { address: usdtJettonMaster, method: 'get_jetton_data', stack: [] },
      { validateStatus: expect.any(Function) },
    );
    expect(result).toEqual({
      valid: true,
      kind: AddressKind.TOKEN,
      isNative: false,
      isToken: true,
      isContract: true,
      address: usdtJettonMaster,
    });
  });

  it('returns CONTRACT for non-jetton contract', async () => {
    mockedAxios.get.mockResolvedValue({
      status: 200,
      data: {
        ok: true,
        result: {
          balance: '0',
          code: 'te6cckEBAQEA...',
          state: 'active',
        },
      },
    });
    mockedAxios.post.mockResolvedValue({
      status: 200,
      data: {
        ok: true,
        result: { exit_code: 1 },
      },
    });

    const result = await classifyTonvmAddress({
      address: usdtJettonMaster,
      chainId: exclusiveChainIds.ton,
      chainConfig: mockChainConfig,
    });

    expect(result).toEqual({
      valid: true,
      kind: AddressKind.CONTRACT,
      isNative: false,
      isToken: false,
      isContract: true,
      address: usdtJettonMaster,
    });
  });

  it('returns CONTRACT when jetton probe fails', async () => {
    mockedAxios.get.mockResolvedValue({
      status: 200,
      data: {
        ok: true,
        result: {
          balance: '0',
          code: 'te6cckEBAQEA...',
          state: 'active',
        },
      },
    });
    mockedAxios.post.mockRejectedValue(new Error('network'));

    const result = await classifyTonvmAddress({
      address: usdtJettonMaster,
      chainId: exclusiveChainIds.ton,
      chainConfig: mockChainConfig,
    });

    expect(result?.kind).toBe(AddressKind.CONTRACT);
  });

  it('returns null when toncenter responds with an error', async () => {
    mockedAxios.get.mockResolvedValue({
      status: 200,
      data: {
        ok: false,
        error: 'invalid address',
      },
    });

    const result = await classifyTonvmAddress({
      address: tonWallet,
      chainId: exclusiveChainIds.ton,
      chainConfig: mockChainConfig,
    });

    expect(result).toBeNull();
  });

  it('returns null when toncenter responds with non-200 status', async () => {
    mockedAxios.get.mockResolvedValue({
      status: 500,
      data: {},
    });

    const result = await classifyTonvmAddress({
      address: tonWallet,
      chainId: exclusiveChainIds.ton,
      chainConfig: mockChainConfig,
    });

    expect(result).toBeNull();
  });

  it('returns null on RPC network error', async () => {
    mockedAxios.get.mockRejectedValue(new Error('network'));

    const result = await classifyTonvmAddress({
      address: tonWallet,
      chainId: exclusiveChainIds.ton,
      chainConfig: mockChainConfig,
    });

    expect(result).toBeNull();
  });

  it('returns null when RPC throws a non-error value', async () => {
    mockedAxios.get.mockRejectedValue('network');

    const result = await classifyTonvmAddress({
      address: tonWallet,
      chainId: exclusiveChainIds.ton,
      chainConfig: mockChainConfig,
    });

    expect(result).toBeNull();
  });

  it('uses custom rpc url when provided', async () => {
    mockedAxios.get.mockResolvedValue({
      status: 200,
      data: {
        ok: true,
        result: { balance: '0', state: 'active' },
      },
    });

    await classifyTonvmAddress({
      address: tonWallet,
      chainId: exclusiveChainIds.ton,
      chainConfig: mockChainConfig,
      rpcUrls: [`${customRpc}/`],
    });

    expect(mockedAxios.get).toHaveBeenCalledWith(`${customRpc}/getAddressInformation`, {
      params: { address: tonWallet },
    });
  });
});
