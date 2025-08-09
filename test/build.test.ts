import DZapClient from '../src/dZapClient';
import { TradeBuildTxnRequest } from '../src/types';

describe('DZapClient - buildTxn', () => {
  let client: DZapClient;

  beforeAll(() => {
    client = DZapClient.getInstance();
  });

  it('should build a cross-chain transaction', async () => {
    const request: TradeBuildTxnRequest = {
      fromChain: 42161,
      data: [
        {
          amount: '374980',
          srcToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
          destDecimals: 18,
          srcDecimals: 6,
          selectedRoute: 'relayLink',
          destToken: '0x4200000000000000000000000000000000000006',
          slippage: 1,
          recipient: '0x99BCEBf44433E901597D9fCb16E799a4847519f6',
          toChain: 8453,
        },
      ],
      integratorId: 'dzap',
      refundee: '0x99BCEBf44433E901597D9fCb16E799a4847519f6',
      sender: '0x99BCEBf44433E901597D9fCb16E799a4847519f6',
      publicKey: '0x99BCEBf44433E901597D9fCb16E799a4847519f6',
    };

    const result = await client.buildTradeTxn(request);
    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.to).toBeDefined();
    expect(result.from).toBeDefined();
    expect(result.chainId).toBeDefined();
  });

  it('should build a same-chain transaction', async () => {
    const request: TradeBuildTxnRequest = {
      fromChain: 42161,
      data: [
        {
          amount: '374980',
          srcToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
          destDecimals: 18,
          srcDecimals: 6,
          selectedRoute: 'sushiswap',
          destToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
          slippage: 1,
          recipient: '0x99BCEBf44433E901597D9fCb16E799a4847519f6',
          toChain: 42161, // Same chain
        },
      ],
      integratorId: 'dzap',
      refundee: '0x99BCEBf44433E901597D9fCb16E799a4847519f6',
      sender: '0x99BCEBf44433E901597D9fCb16E799a4847519f6',
      publicKey: '0x99BCEBf44433E901597D9fCb16E799a4847519f6',
    };

    const result = await client.buildTradeTxn(request);
    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.to).toBeDefined();
    expect(result.from).toBeDefined();
    expect(result.chainId).toBeDefined();
  });
});
