import { TradeStatusResponse } from '../../../src';
import DZapClient from '../../../src/dZapClient';
import { LIVE_TEST_TIMEOUT_MS } from '../../fixtures/realWorld';
import { delay, STATUS_API_DELAY_MS, withRateLimitRetry } from '../../helpers/rateLimitRetry';

const STATUS_TEST_TIMEOUT_MS = LIVE_TEST_TIMEOUT_MS * 4;

describe('DZapClient - getStatus', () => {
  jest.setTimeout(STATUS_TEST_TIMEOUT_MS);

  let client: DZapClient;

  beforeAll(() => {
    client = DZapClient.getInstance();
  });

  it(
    'should fetch status for multiple transaction IDs',
    async () => {
      const txHashes =
        '0x3c48cb39902c215e5b055235ed2d11b0190e3f4b1f73566862359e334a96b166,0x3a26dc8763166b9d39db46fa1047902896e07dd2a2cb8761a6c84c17b7165ab7,0x320be5bbc92857806bc08a148addb72be4b60225bca3fef4374cbd60100c7f9e';
      const chainIds = '8453,8453,10';
      const txHashList = txHashes.split(',');

      const result = await withRateLimitRetry(() => client.getTradeMultiTxnStatus({ txHashes, chainIds }));

      expect(result).toBeDefined();
      const typedResult = result as TradeStatusResponse[];
      expect(Array.isArray(typedResult)).toBe(true);
      expect(typedResult.length).toBe(txHashList.length);

      for (const statusResponse of typedResult) {
        expect(statusResponse).toHaveProperty('status');
      }
    },
    STATUS_TEST_TIMEOUT_MS,
  );

  it(
    'should fetch status for a single transaction',
    async () => {
      await delay(STATUS_API_DELAY_MS);
      const txHash = '0x3c48cb39902c215e5b055235ed2d11b0190e3f4b1f73566862359e334a96b166';
      const chainId = 8453;

      const result = await withRateLimitRetry(() => client.getTradeTxnStatus({ txHash, chainId }));
      expect(result).toBeDefined();
      const typedResult = result as TradeStatusResponse;
      expect(typedResult).toHaveProperty('status');
    },
    STATUS_TEST_TIMEOUT_MS,
  );
});
