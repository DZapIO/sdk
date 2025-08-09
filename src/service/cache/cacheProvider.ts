import Cache from 'node-cache';

export class CacheProvider {
  private static _instance: CacheProvider;
  private readonly client: Cache;

  private constructor() {
    this.client = new Cache({
      checkperiod: 10,
      deleteOnExpire: true,
    });
  }

  public static get instance(): CacheProvider {
    if (!CacheProvider._instance) {
      CacheProvider._instance = new CacheProvider();
    }
    return CacheProvider._instance;
  }

  public static set<T>(key: string, value: T, ttl?: number): void {
    if (value == null) return;
    this.instance.client.set(key, value, ttl ?? 0);
  }

  public static get<T>(key: string): T | undefined {
    return this.instance.client.get<T>(key);
  }

  public static delete(key: string): number {
    return this.instance.client.del(key);
  }

  public static flush(): void {
    this.instance.client.flushAll();
  }
}
