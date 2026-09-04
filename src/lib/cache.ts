interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private defaultTTL: number;
  private prefix: string;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl ?? 300_000;
    this.prefix = options.prefix ?? "cache:";
    this.startCleanup();
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store) {
        if (entry.expiresAt <= now) {
          this.store.delete(key);
        }
      }
    }, 60_000);
  }

  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private prefixedKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(this.prefixedKey(key));
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(this.prefixedKey(key));
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttl?: number): void {
    const effectiveTTL = ttl ?? this.defaultTTL;
    this.store.set(this.prefixedKey(key), {
      value,
      expiresAt: Date.now() + effectiveTTL,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.store.delete(this.prefixedKey(key));
  }

  clear(): void {
    this.store.clear();
  }

  keys(): string[] {
    const now = Date.now();
    const result: string[] = [];
    for (const [key, entry] of this.store) {
      if (entry.expiresAt > now) {
        result.push(key.replace(this.prefix, ""));
      }
    }
    return result;
  }

  size(): number {
    const now = Date.now();
    let count = 0;
    for (const entry of this.store.values()) {
      if (entry.expiresAt > now) count++;
    }
    return count;
  }

  getOrSet<T>(key: string, factory: () => T | Promise<T>, ttl?: number): T | Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;

    const value = factory();
    if (value instanceof Promise) {
      return value.then((v) => {
        this.set(key, v, ttl);
        return v;
      });
    }
    this.set(key, value, ttl);
    return value;
  }

  async getOrSetAsync<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;

    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  invalidatePattern(pattern: string): number {
    const regex = new RegExp(
      "^" + this.prefix + pattern.replace(/\*/g, ".*") + "$"
    );
    let count = 0;
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  getStats(): { size: number; keys: string[]; hitRate: number } {
    return {
      size: this.size(),
      keys: this.keys(),
      hitRate: 0,
    };
  }
}

let defaultCache: MemoryCache | null = null;

export function getCache(options?: CacheOptions): MemoryCache {
  if (!defaultCache) {
    defaultCache = new MemoryCache(options);
  }
  return defaultCache;
}

export function createCache(options: CacheOptions): MemoryCache {
  return new MemoryCache(options);
}

export const cache = getCache();

export async function cacheAside<T>(
  key: string,
  factory: () => Promise<T>,
  ttl?: number
): Promise<T> {
  return cache.getOrSetAsync(key, factory, ttl);
}

export function invalidateCache(pattern: string): number {
  return cache.invalidatePattern(pattern);
}
