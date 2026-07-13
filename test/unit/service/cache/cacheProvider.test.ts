import { CacheProvider } from '../../../../src/service/cache/cacheProvider';

describe('service/cache/cacheProvider', () => {
  beforeEach(() => {
    CacheProvider.flush();
  });

  it('stores and retrieves values', () => {
    CacheProvider.set('key1', { foo: 'bar' }, 60);
    expect(CacheProvider.get<{ foo: string }>('key1')).toEqual({ foo: 'bar' });
  });

  it('returns undefined for missing keys', () => {
    expect(CacheProvider.get('missing')).toBeUndefined();
  });

  it('deletes keys', () => {
    CacheProvider.set('key2', 'value');
    expect(CacheProvider.delete('key2')).toBe(1);
    expect(CacheProvider.get('key2')).toBeUndefined();
  });

  it('ignores null values on set', () => {
    CacheProvider.set('nullKey', null as any);
    expect(CacheProvider.get('nullKey')).toBeUndefined();
  });

  it('uses singleton instance', () => {
    CacheProvider.set('singleton', 42);
    expect(CacheProvider.get('singleton')).toBe(42);
  });
});
