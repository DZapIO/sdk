import { StatusResponse } from 'src/types';
import DzapClient from '../client';

describe('DzapClient - getStatus', () => {
  let client: DzapClient;

  beforeAll(() => {
    client = DzapClient.getInstance();
  });

  it('should fetch status for multiple transaction IDs', async () => {
    const txIds =
      '8453-0x3c48cb39902c215e5b055235ed2d11b0190e3f4b1f73566862359e334a96b166,8453-0x3a26dc8763166b9d39db46fa1047902896e07dd2a2cb8761a6c84c17b7165ab7,10-0x320be5bbc92857806bc08a148addb72be4b60225bca3fef4374cbd60100c7f9e';
    const txIdArray = txIds.split(',');

    const result = await client.getStatus({ txIds });

    expect(result).toBeDefined();
    // Cast the result to the expected record type for multi-ID lookups
    const typedResult = result as Record<string, StatusResponse>;
    const resultKeys = Object.keys(typedResult);
    expect(resultKeys.length).toBe(txIdArray.length);

    for (const txId of txIdArray) {
      expect(typedResult).toHaveProperty(txId);
      const statusResponse = typedResult[txId];
      const statusKeys = Object.keys(statusResponse);
      expect(statusKeys.length).toBeGreaterThan(0);
      // Check that the first value has a 'status' property
      const firstStatus = statusResponse[statusKeys[0]];
      expect(firstStatus).toHaveProperty('status');
    }
  });

  it('should fetch status for a single transaction', async () => {
    const txHash = '0x3c48cb39902c215e5b055235ed2d11b0190e3f4b1f73566862359e334a96b166';
    const chainId = '8453';

    const result = await client.getStatus({ txHash, chainId });
    expect(result).toBeDefined();
    const typedResult = result as StatusResponse;
    const resultKeys = Object.keys(typedResult);
    expect(resultKeys.length).toBeGreaterThan(0);
    // Check that the first value has a 'status' property
    const firstStatus = typedResult[resultKeys[0]];
    expect(firstStatus).toHaveProperty('status');
  });
});
