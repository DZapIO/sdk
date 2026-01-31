import type { TradeStatusResponse } from '../src';
import DZapClient from '../src/dZapClient';

describe('DZapClient - getStatus', () => {
  let client: DZapClient;

  beforeAll(() => {
    client = DZapClient.getInstance();
  });

  it('should fetch status for multiple transaction IDs', async () => {
    const txHashes =
      '0x3c48cb39902c215e5b055235ed2d11b0190e3f4b1f73566862359e334a96b166,0x3a26dc8763166b9d39db46fa1047902896e07dd2a2cb8761a6c84c17b7165ab7,0x320be5bbc92857806bc08a148addb72be4b60225bca3fef4374cbd60100c7f9e';
    const chainIds = '8453,8453,10';

    const result = await client.trade.getMultiTxnStatus({ txHashes, chainIds });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(txHashes.split(',').length);

    for (const statusResponse of result) {
      expect(statusResponse).toHaveProperty('status');
    }
  });

  it('should fetch status for a single transaction', async () => {
    const txHash = '0x3c48cb39902c215e5b055235ed2d11b0190e3f4b1f73566862359e334a96b166';
    const chainId = 8453;

    const result = await client.trade.getStatus({ txHash, chainId });
    expect(result).toBeDefined();
    const typedResult = result as TradeStatusResponse;
    expect(typedResult).toHaveProperty('status');
  });
});
