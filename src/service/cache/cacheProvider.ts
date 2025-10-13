import NodeCache from 'node-cache';
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

let Cache: typeof NodeCache | null = null;
if (isNode) {
  try {
    Cache = NodeCache;
  } catch (error) {
    // Fallback to in-memory cache if node-cache is not available
    Cache = null;
  }
}

// Simple in-memory cache fallback for browser environments
class InMemoryCache {
  private cache = new Map<string, { value: any; expiry?: number }>();

  set<T>(key: string, value: T, ttl?: number): void {
    const expiry = ttl ? Date.now() + ttl * 1000 : undefined;
    this.cache.set(key, { value, expiry });
  }

  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  del(key: string): number {
    return this.cache.delete(key) ? 1 : 0;
  }

  flushAll(): void {
    this.cache.clear();
  }
}

export class CacheProvider {
  private static _instance: CacheProvider;
  private readonly client: NodeCache | InMemoryCache;

  private constructor() {
    if (isNode && Cache) {
      this.client = new Cache({
        checkperiod: 10,
        deleteOnExpire: true,
      });
    } else {
      // Use in-memory cache for browser or when node-cache is not available
      this.client = new InMemoryCache();
    }
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
    return this.instance.client.get(key) as T | undefined;
  }

  public static delete(key: string): number {
    return this.instance.client.del(key);
  }

  public static flush(): void {
    this.instance.client.flushAll();
  }
}
