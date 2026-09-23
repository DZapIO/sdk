import DZapClient from '../src/dZapClient';

describe('DZapClient - gasless tokens', () => {
  let client: DZapClient;

  beforeAll(() => {
    client = DZapClient.getInstance();
  });

  it('should return gasless tokens grouped by chain for all chains', async () => {
    const tokensByChain = await client.getAllGaslessTokens();

    const chainIds = Object.keys(tokensByChain);
    expect(chainIds.length).toBeGreaterThan(0);

    const tokens = tokensByChain[Number(chainIds[0])];
    const addresses = Object.keys(tokens);
    expect(addresses.length).toBeGreaterThan(0);

    const token = tokens[addresses[0]];
    expect(token.gasless).toBe(true);
    expect(token.permit).toBeDefined();
  });

  it('should return gasless tokens for a single chain', async () => {
    const arbitrumChainId = 42161;
    const tokens = await client.getGaslessTokens(arbitrumChainId);

    const addresses = Object.keys(tokens);
    expect(addresses.length).toBeGreaterThan(0);

    // USDC on Arbitrum is expected to support gasless
    const usdc = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
    expect(tokens[usdc]).toBeDefined();
    expect(tokens[usdc].gasless).toBe(true);
    expect(tokens[usdc].chainId).toBe(arbitrumChainId);
  });
});
