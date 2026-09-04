interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp: string;
  userId?: string;
  sessionId: string;
  distinctId: string;
}

interface AnalyticsConfig {
  apiKey: string;
  host?: string;
  flushInterval: number;
  maxQueueSize: number;
  enabled: boolean;
  debug: boolean;
}

interface UserProperties {
  id?: string;
  email?: string;
  name?: string;
  plan?: string;
  createdAt?: string;
  [key: string]: unknown;
}

class AnalyticsService {
  private config: AnalyticsConfig;
  private queue: AnalyticsEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private sessionId: string;
  private distinctId: string;
  private userProperties: UserProperties = {};

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      apiKey: config.apiKey ?? "",
      host: config.host ?? "https://api.analytics.com",
      flushInterval: config.flushInterval ?? 10_000,
      maxQueueSize: config.maxQueueSize ?? 100,
      enabled: config.enabled ?? true,
      debug: config.debug ?? false,
    };

    this.sessionId = this.generateId();
    this.distinctId = this.getOrCreateDistinctId();

    if (this.config.enabled) {
      this.startFlushTimer();
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private getOrCreateDistinctId(): string {
    if (typeof window === "undefined") return this.generateId();
    let id = localStorage.getItem("analytics_distinct_id");
    if (!id) {
      id = this.generateId();
      localStorage.setItem("analytics_distinct_id", id);
    }
    return id;
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => this.flush(), this.config.flushInterval);
  }

  private log(message: string, ...args: unknown[]): void {
    if (this.config.debug) {
      console.log(`[Analytics] ${message}`, ...args);
    }
  }

  track(
    name: string,
    properties?: Record<string, unknown>
  ): void {
    if (!this.config.enabled) return;

    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: new Date().toISOString(),
      userId: this.userProperties.id,
      sessionId: this.sessionId,
      distinctId: this.distinctId,
    };

    this.queue.push(event);
    this.log("Event tracked:", name, properties);

    if (this.queue.length >= this.config.maxQueueSize) {
      this.flush();
    }
  }

  identify(properties: UserProperties): void {
    this.userProperties = { ...this.userProperties, ...properties };
    if (properties.id) {
      this.distinctId = properties.id;
      if (typeof window !== "undefined") {
        localStorage.setItem("analytics_distinct_id", properties.id);
      }
    }
    this.log("User identified:", properties);
  }

  reset(): void {
    this.userProperties = {};
    this.distinctId = this.generateId();
    this.sessionId = this.generateId();
    if (typeof window !== "undefined") {
      localStorage.setItem("analytics_distinct_id", this.distinctId);
    }
  }

  page(name: string, properties?: Record<string, unknown>): void {
    this.track("page_view", { page: name, ...properties });
  }

  flush(): void {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    this.log("Flushing events:", events.length);

    // In production, send to analytics backend
    if (typeof window !== "undefined" && this.config.apiKey) {
      navigator.sendBeacon?.(
        `${this.config.host}/batch`,
        JSON.stringify({ events, apiKey: this.config.apiKey })
      );
    }
  }

  shutdown(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }

  getQueueSize(): number {
    return this.queue.length;
  }
}

let analyticsInstance: AnalyticsService | null = null;

export function getAnalytics(
  config?: Partial<AnalyticsConfig>
): AnalyticsService {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsService(config);
  }
  return analyticsInstance;
}

export function trackEvent(
  name: string,
  properties?: Record<string, unknown>
): void {
  getAnalytics().track(name, properties);
}

export function identifyUser(properties: UserProperties): void {
  getAnalytics().identify(properties);
}

export function trackPageView(
  name: string,
  properties?: Record<string, unknown>
): void {
  getAnalytics().page(name, properties);
}

export { AnalyticsService };
export type { AnalyticsEvent, AnalyticsConfig, UserProperties };
