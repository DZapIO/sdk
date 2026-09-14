import DZapClient from '../../src/dZapClient';
import { config } from '../../src/config';

/**
 * Regression tests for the `getInstance` signature.
 *
 * Before this, the README and the method's own JSDoc both showed
 * `DZapClient.getInstance({ 1: ['https://...'] })` while the signature was
 * `getInstance(apiKey?: string, rpcUrls?: ...)`. The RPC map landed in the
 * `apiKey` slot, so requests went out unauthenticated with a stringified
 * object as the `x-api-key` header and the custom RPCs were never applied —
 * with no error raised.
 */
describe('DZapClient.getInstance', () => {
  beforeEach(() => {
    config.setApiKey(null as unknown as string);
    config.setRpcUrlsByChainId({});
  });

  it('returns the same singleton instance', () => {
    expect(DZapClient.getInstance()).toBe(DZapClient.getInstance());
  });

  it('accepts an options object and applies both fields', () => {
    DZapClient.getInstance({ apiKey: 'test-key', rpcUrls: { 1: ['https://eth.example'] } });

    expect(config.getApiKey()).toBe('test-key');
    expect(config.getRpcUrlsByChainId(1)).toEqual(['https://eth.example']);
  });

  it('still supports the legacy positional form', () => {
    DZapClient.getInstance('positional-key', { 42161: ['https://arb.example'] });

    expect(config.getApiKey()).toBe('positional-key');
    expect(config.getRpcUrlsByChainId(42161)).toEqual(['https://arb.example']);
  });

  it('treats a bare chainId map as RPC urls, never as an API key', () => {
    // This is the exact shape the old docs told everyone to use.
    DZapClient.getInstance({ 1: ['https://eth.example'], 42161: ['https://arb.example'] });

    expect(config.getApiKey()).toBeNull();
    expect(config.getRpcUrlsByChainId(1)).toEqual(['https://eth.example']);
    expect(config.getRpcUrlsByChainId(42161)).toEqual(['https://arb.example']);
  });

  it('never stringifies an object into the api key', () => {
    DZapClient.getInstance({ 1: ['https://eth.example'] });

    const apiKey = config.getApiKey();
    expect(apiKey).not.toBe('[object Object]');
    expect(apiKey === null || !apiKey.includes('object')).toBe(true);
  });

  it('rejects a non-string apiKey instead of failing silently', () => {
    expect(() => DZapClient.getInstance({ apiKey: { 1: ['https://eth.example'] } } as never)).toThrow(TypeError);
  });

  it('rejects a non-object, non-string first argument', () => {
    expect(() => DZapClient.getInstance(42 as never)).toThrow(TypeError);
  });

  it('leaves configuration untouched when called with no arguments', () => {
    DZapClient.getInstance({ apiKey: 'sticky-key' });
    DZapClient.getInstance();

    expect(config.getApiKey()).toBe('sticky-key');
  });
});
