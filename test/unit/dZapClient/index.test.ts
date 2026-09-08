jest.mock('../../../src/api', () => ({
  fetchTradeQuotes: jest.fn(),
  fetchTradeBuildTxnData: jest.fn(),
  fetchStatus: jest.fn(),
  fetchMultiTxStatus: jest.fn(),
  fetchAllSupportedChains: jest.fn(),
  fetchAllTokens: jest.fn(),
  fetchTokenDetails: jest.fn(),
  fetchZapQuote: jest.fn(),
  fetchZapBuildTxnData: jest.fn(),
  fetchCalculatedPoints: jest.fn(),
  broadcastTradeTx: jest.fn(),
  broadcastZapTx: jest.fn(),
}));

jest.mock('../../../src/utils/updateQuotes', () => ({
  updateQuotes: jest.fn((quotes) => Promise.resolve(quotes)),
}));

import DZapClient from '../../../src/dZapClient';
import { fetchTradeQuotes, fetchTradeBuildTxnData, fetchAllSupportedChains, fetchCalculatedPoints, fetchZapQuote } from '../../../src/api';
import { updateQuotes } from '../../../src/utils/updateQuotes';
import { mockTradeQuotesResponse } from '../../fixtures/quotes';
import { mockChainConfig } from '../../fixtures/chainConfig';
import { config } from '../../../src/config';

describe('dZapClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (DZapClient as any).chainConfig = null;
    (fetchAllSupportedChains as jest.Mock).mockResolvedValue(Object.values(mockChainConfig));
  });

  it('getInstance returns singleton', () => {
    const a = DZapClient.getInstance();
    const b = DZapClient.getInstance();
    expect(a).toBe(b);
  });

  it('getInstance sets api key and rpc urls', () => {
    DZapClient.getInstance('my-key', { 42161: ['https://rpc.test'] });
    expect(config.getApiKey()).toBe('my-key');
    expect(config.getRpcUrlsByChainId(42161)).toEqual(['https://rpc.test']);
  });

  it('getChainConfig caches chain data', async () => {
    const config1 = await DZapClient.getChainConfig();
    const config2 = await DZapClient.getChainConfig();
    expect(fetchAllSupportedChains).toHaveBeenCalledTimes(1);
    expect(config1[42161]).toBeDefined();
    expect(config2).toEqual(config1);
  });

  it('getTradeQuotes fetches and enriches quotes', async () => {
    const quotes = mockTradeQuotesResponse();
    (fetchTradeQuotes as jest.Mock).mockResolvedValue(quotes);
    const client = DZapClient.getInstance();
    const request = { fromChain: 42161, account: '0x0', data: [] };

    const result = await client.getTradeQuotes(request as any);
    expect(fetchTradeQuotes).toHaveBeenCalledWith(request);
    expect(updateQuotes).toHaveBeenCalled();
    expect(result).toEqual(quotes);
  });

  it('buildTradeTxn delegates to api', async () => {
    const buildResponse = { data: '0x', to: '0x1', from: '0x2', chainId: 42161 };
    (fetchTradeBuildTxnData as jest.Mock).mockResolvedValue(buildResponse);
    const client = DZapClient.getInstance();
    const request = { fromChain: 42161, data: [] };

    const result = await client.buildTradeTxn(request as any);
    expect(fetchTradeBuildTxnData).toHaveBeenCalledWith(request);
    expect(result).toEqual(buildResponse);
  });

  it('calculatePoints delegates to api', async () => {
    (fetchCalculatedPoints as jest.Mock).mockResolvedValue({ points: 100 });
    const client = DZapClient.getInstance();
    const result = await client.calculatePoints({ account: '0x0' } as any);
    expect(result.points).toBe(100);
  });

  it('getZapQuote delegates to api', async () => {
    (fetchZapQuote as jest.Mock).mockResolvedValue({ data: { quote: true } });
    const client = DZapClient.getInstance();
    const result = await client.getZapQuote({ srcChainId: 42161 } as any);
    expect(fetchZapQuote).toHaveBeenCalled();
    expect(result).toEqual({ quote: true });
  });

  it('getDZapAbi returns abi via static method', () => {
    const abi = DZapClient.getDZapAbi('trade' as any, 'v1' as any);
    expect(abi).toBeDefined();
  });

  it('getOtherAbi returns permit2 abi', () => {
    const abi = DZapClient.getOtherAbi('permit2' as any);
    expect(abi).toBeDefined();
  });
});
