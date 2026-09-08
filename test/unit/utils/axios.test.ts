jest.mock('../../../src/axios/baseClient', () => ({
  baseApiClient: jest.fn(),
  baseZapApiClient: jest.fn(),
}));

jest.mock('../../../src/config', () => ({
  config: {
    getApiKey: jest.fn().mockReturnValue('test-api-key'),
  },
}));

import { baseApiClient, baseZapApiClient } from '../../../src/axios/baseClient';
import { invoke, invokeZap } from '../../../src/utils/axios';
import { GET, POST } from '../../../src/constants/httpMethods';

const mockedBaseApiClient = baseApiClient as unknown as jest.Mock;
const mockedBaseZapApiClient = baseZapApiClient as unknown as jest.Mock;

describe('utils/axios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedBaseApiClient.mockResolvedValue({ data: { trade: true } });
    mockedBaseZapApiClient.mockResolvedValue({ data: { zap: true } });
  });

  it('invoke sends POST with api key header', async () => {
    const result = await invoke({ endpoint: '/quotes', data: { foo: 'bar' }, method: POST });
    expect(mockedBaseApiClient).toHaveBeenCalledWith(
      expect.objectContaining({
        method: POST,
        url: '/quotes',
        data: { foo: 'bar' },
        headers: expect.objectContaining({ 'x-api-key': 'test-api-key' }),
      }),
    );
    expect(result).toEqual({ trade: true });
  });

  it('invoke sends GET with params', async () => {
    await invoke({ endpoint: '/chains', data: { chainId: 1 }, method: GET });
    expect(mockedBaseApiClient).toHaveBeenCalledWith(
      expect.objectContaining({
        method: GET,
        params: { chainId: 1 },
        data: undefined,
      }),
    );
  });

  it('invokeZap uses zap client', async () => {
    const result = await invokeZap({ endpoint: '/quote', data: {}, method: POST });
    expect(mockedBaseZapApiClient).toHaveBeenCalled();
    expect(result).toEqual({ zap: true });
  });

  it('invoke propagates errors', async () => {
    mockedBaseApiClient.mockRejectedValue(new Error('network error'));
    await expect(invoke({ endpoint: '/fail' })).rejects.toThrow('network error');
  });
});
