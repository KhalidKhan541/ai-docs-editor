interface TokenBucketConfig {
  capacity: number;
  refillRate: number;
  refillInterval: number;
}

interface BucketState {
  tokens: number;
  lastRefill: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetIn: number;
}

export class TokenBucket {
  private buckets = new Map<string, BucketState>();
  private config: TokenBucketConfig;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<TokenBucketConfig> = {}) {
    this.config = {
      capacity: config.capacity ?? 100,
      refillRate: config.refillRate ?? 10,
      refillInterval: config.refillInterval ?? 1_000,
    };
    this.startCleanup();
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, state] of this.buckets) {
        if (now - state.lastRefill > 60_000) {
          this.buckets.delete(key);
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

  private refill(state: BucketState): BucketState {
    const now = Date.now();
    const elapsed = now - state.lastRefill;
    const refillCount = Math.floor(elapsed / this.config.refillInterval) * this.config.refillRate;

    if (refillCount > 0) {
      return {
        tokens: Math.min(this.config.capacity, state.tokens + refillCount),
        lastRefill: now,
      };
    }

    return state;
  }

  consume(key: string, tokens = 1): RateLimitResult {
    let state = this.buckets.get(key);

    if (!state) {
      state = { tokens: this.config.capacity, lastRefill: Date.now() };
    }

    state = this.refill(state);

    if (state.tokens >= tokens) {
      state.tokens -= tokens;
      this.buckets.set(key, state);

      return {
        allowed: true,
        remaining: state.tokens,
        limit: this.config.capacity,
        resetIn: Math.ceil(
          ((this.config.capacity - state.tokens) / this.config.refillRate) *
            this.config.refillInterval
        ),
      };
    }

    this.buckets.set(key, state);

    return {
      allowed: false,
      remaining: state.tokens,
      limit: this.config.capacity,
      resetIn: Math.ceil(
        ((tokens - state.tokens) / this.config.refillRate) *
          this.config.refillInterval
      ),
    };
  }

  peek(key: string): RateLimitResult {
    let state = this.buckets.get(key);
    if (!state) {
      return {
        allowed: true,
        remaining: this.config.capacity,
        limit: this.config.capacity,
        resetIn: 0,
      };
    }

    state = this.refill(state);

    return {
      allowed: state.tokens >= 1,
      remaining: state.tokens,
      limit: this.config.capacity,
      resetIn: state.tokens < this.config.capacity
        ? Math.ceil(
            ((this.config.capacity - state.tokens) / this.config.refillRate) *
              this.config.refillInterval
          )
        : 0,
    };
  }

  reset(key?: string): void {
    if (key) {
      this.buckets.delete(key);
    } else {
      this.buckets.clear();
    }
  }

  getStats(): {
    totalBuckets: number;
    activeBuckets: string[];
  } {
    return {
      totalBuckets: this.buckets.size,
      activeBuckets: Array.from(this.buckets.keys()),
    };
  }
}

let defaultBucket: TokenBucket | null = null;

export function getRateLimiter(
  config?: Partial<TokenBucketConfig>
): TokenBucket {
  if (!defaultBucket) {
    defaultBucket = new TokenBucket(config);
  }
  return defaultBucket;
}

export function createRateLimiter(
  config: Partial<TokenBucketConfig>
): TokenBucket {
  return new TokenBucket(config);
}

export const rateLimiter = getRateLimiter();

export function rateLimit(
  key: string,
  tokens?: number
): RateLimitResult {
  return rateLimiter.consume(key, tokens);
}
