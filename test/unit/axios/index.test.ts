import type { AxiosAdapter } from 'axios';
import AxiosClient from '../../../src/axios';
import { MAX_RETRY_ATTEMPTS, RETRY_DELAY_MS } from '../../../src/constants/axios';
import type { ExtendedAxiosRequestConfig } from '../../../src/types/axiosClient';

const DZAP_API_BASE = 'https://api.dzap.io';
const DZAP_ZAP_API_BASE = 'https://zap.dzap.io';

let baseUrlCounter = 0;

const uniqueBaseUrl = (prefix: string) => `${prefix}/coverage-${++baseUrlCounter}`;

const attachAdapter = (client: ReturnType<typeof AxiosClient.getInstance>, adapter: AxiosAdapter) => {
  client.defaults.adapter = adapter;
  return client;
};

describe('axios/index (AxiosClient)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns a singleton axios instance per base URL', () => {
    const tradeClientA = AxiosClient.getInstance(DZAP_API_BASE);
    const tradeClientB = AxiosClient.getInstance(DZAP_API_BASE);
    const zapClient = AxiosClient.getInstance(DZAP_ZAP_API_BASE);

    expect(tradeClientA).toBe(tradeClientB);
    expect(zapClient).not.toBe(tradeClientA);
    expect(tradeClientA.defaults.baseURL).toBe(DZAP_API_BASE);
    expect(zapClient.defaults.baseURL).toBe(DZAP_ZAP_API_BASE);
  });

  it('rejects after exhausting MAX_RETRY_ATTEMPTS when shouldRetry is true', async () => {
    let attempts = 0;
    const client = attachAdapter(AxiosClient.getInstance(uniqueBaseUrl(DZAP_API_BASE)), async (config) => {
      attempts += 1;
      return Promise.reject(Object.assign(new Error('gateway timeout'), { config }));
    });

    const requestPromise = client.request({
      url: '/v1/status',
      method: 'GET',
      shouldRetry: true,
    } as ExtendedAxiosRequestConfig);

    const assertion = expect(requestPromise).rejects.toThrow('gateway timeout');
    await jest.runAllTimersAsync();
    await assertion;

    expect(attempts).toBe(MAX_RETRY_ATTEMPTS + 1);
  });

  it('retries failed requests after RETRY_DELAY_MS and succeeds', async () => {
    let attempts = 0;
    const client = attachAdapter(AxiosClient.getInstance(uniqueBaseUrl(DZAP_API_BASE)), async (config) => {
      attempts += 1;
      if (attempts === 1) {
        return Promise.reject(Object.assign(new Error('temporary outage'), { config }));
      }
      return {
        data: { status: 'completed', txHash: '0x88df016429689c0793a58908954e692632b30636f6f923933f58f9e5a8e6b335' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    });

    const requestPromise = client.request({
      url: '/v1/status/0x88df016429689c0793a58908954e692632b30636f6f923933f58f9e5a8e6b335',
      method: 'GET',
      shouldRetry: true,
    } as ExtendedAxiosRequestConfig);

    await jest.advanceTimersByTimeAsync(RETRY_DELAY_MS);
    const response = await requestPromise;

    expect(attempts).toBe(2);
    expect(response.data).toEqual({
      status: 'completed',
      txHash: '0x88df016429689c0793a58908954e692632b30636f6f923933f58f9e5a8e6b335',
    });
  });

  it('defaults shouldRetry to false and retryCount to zero on failed requests', async () => {
    let attempts = 0;
    let lastConfig: ExtendedAxiosRequestConfig | undefined;

    const client = attachAdapter(AxiosClient.getInstance(uniqueBaseUrl(DZAP_API_BASE)), async (config) => {
      attempts += 1;
      lastConfig = config as ExtendedAxiosRequestConfig;
      return Promise.reject(Object.assign(new Error('rate limited'), { config }));
    });

    await expect(client.get('/v1/tokens')).rejects.toThrow('rate limited');

    expect(attempts).toBe(1);
    expect(lastConfig?.shouldRetry).toBe(false);
    expect(lastConfig?.retryCount).toBe(0);
  });
});
