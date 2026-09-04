interface FeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
  rules?: FlagRule[];
  defaultValue: boolean;
  variants?: FlagVariant[];
}

interface FlagRule {
  attribute: string;
  operator: "eq" | "neq" | "in" | "not_in" | "gt" | "lt" | "contains" | "starts_with";
  value: string | number | string[];
  percentage?: number;
}

interface FlagVariant {
  key: string;
  weight: number;
  payload?: Record<string, unknown>;
}

interface FeatureFlagConfig {
  environment: string;
  apiKey?: string;
  endpoint?: string;
  refreshInterval: number;
  defaults: Record<string, boolean>;
}

interface EvaluationContext {
  userId?: string;
  email?: string;
  plan?: string;
  country?: string;
  attributes?: Record<string, unknown>;
}

const DEFAULT_FLAGS: Record<string, FeatureFlag> = {
  "ai-writing": {
    key: "ai-writing",
    enabled: true,
    description: "AI-powered writing assistance",
    defaultValue: true,
  },
  "ai-suggestions": {
    key: "ai-suggestions",
    enabled: true,
    description: "Real-time AI suggestions",
    defaultValue: true,
  },
  "collaboration": {
    key: "collaboration",
    enabled: true,
    description: "Real-time collaboration",
    defaultValue: true,
  },
  "comments": {
    key: "comments",
    enabled: true,
    description: "Document commenting",
    defaultValue: true,
  },
  "templates": {
    key: "templates",
    enabled: true,
    description: "Document templates",
    defaultValue: true,
  },
  "export-pdf": {
    key: "export-pdf",
    enabled: true,
    description: "PDF export",
    defaultValue: true,
  },
  "export-markdown": {
    key: "export-markdown",
    enabled: true,
    description: "Markdown export",
    defaultValue: true,
  },
  "version-history": {
    key: "version-history",
    enabled: true,
    description: "Document version history",
    defaultValue: true,
  },
  "advanced-analytics": {
    key: "advanced-analytics",
    enabled: false,
    description: "Advanced analytics dashboard",
    defaultValue: false,
  },
  "api-access": {
    key: "api-access",
    enabled: false,
    description: "Public API access",
    defaultValue: false,
  },
  "custom-branding": {
    key: "custom-branding",
    enabled: false,
    description: "Custom branding for teams",
    defaultValue: false,
  },
  "sso": {
    key: "sso",
    enabled: false,
    description: "Single Sign-On",
    defaultValue: false,
  },
};

class FeatureFlagService {
  private flags: Map<string, FeatureFlag> = new Map();
  private config: FeatureFlagConfig;
  private context: EvaluationContext = {};
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Map<string, Set<(enabled: boolean) => void>>();

  constructor(config: Partial<FeatureFlagConfig> = {}) {
    this.config = {
      environment: config.environment ?? "production",
      apiKey: config.apiKey,
      endpoint: config.endpoint,
      refreshInterval: config.refreshInterval ?? 60_000,
      defaults: config.defaults ?? {},
    };

    this.loadDefaults();

    if (this.config.apiKey && this.config.endpoint) {
      this.startRefresh();
    }
  }

  private loadDefaults(): void {
    for (const [key, flag] of Object.entries(DEFAULT_FLAGS)) {
      this.flags.set(key, { ...flag });
    }
  }

  private startRefresh(): void {
    this.refreshTimer = setInterval(
      () => this.fetchFlags(),
      this.config.refreshInterval
    );
    this.fetchFlags();
  }

  private async fetchFlags(): Promise<void> {
    if (!this.config.apiKey || !this.config.endpoint) return;

    try {
      const response = await fetch(
        `${this.config.endpoint}/flags?key=${this.config.apiKey}&env=${this.config.environment}`,
        { method: "GET" }
      );

      if (response.ok) {
        const data = (await response.json()) as Record<string, FeatureFlag>;
        for (const [key, flag] of Object.entries(data)) {
          const existing = this.flags.get(key);
          this.flags.set(key, flag);
          if (existing && existing.enabled !== flag.enabled) {
            this.notifyListeners(key, flag.enabled);
          }
        }
      }
    } catch {
      // Silently fail and use cached values
    }
  }

  private evaluateRules(flag: FeatureFlag): boolean {
    if (!flag.rules || flag.rules.length === 0) return flag.enabled;

    for (const rule of flag.rules) {
      const value = rule.attribute === "userId"
        ? this.context.userId
        : rule.attribute === "email"
          ? this.context.email
          : rule.attribute === "plan"
            ? this.context.plan
            : rule.attribute === "country"
              ? this.context.country
              : this.context.attributes?.[rule.attribute];

      if (value === undefined || value === null) continue;

      let matches = false;

      switch (rule.operator) {
        case "eq":
          matches = value === rule.value;
          break;
        case "neq":
          matches = value !== rule.value;
          break;
        case "in":
          matches = Array.isArray(rule.value) && rule.value.includes(String(value));
          break;
        case "not_in":
          matches = Array.isArray(rule.value) && !rule.value.includes(String(value));
          break;
        case "gt":
          matches = Number(value) > Number(rule.value);
          break;
        case "lt":
          matches = Number(value) < Number(rule.value);
          break;
        case "contains":
          matches = String(value).includes(String(rule.value));
          break;
        case "starts_with":
          matches = String(value).startsWith(String(rule.value));
          break;
      }

      if (matches && rule.percentage !== undefined) {
        const hash = this.hashString(
          `${flag.key}:${this.context.userId ?? "anonymous"}`
        );
        matches = (hash % 100) < rule.percentage;
      }

      if (matches) return true;
    }

    return false;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private notifyListeners(key: string, enabled: boolean): void {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      for (const listener of keyListeners) {
        listener(enabled);
      }
    }
  }

  setContext(context: EvaluationContext): void {
    this.context = context;
  }

  isEnabled(key: string): boolean {
    const flag = this.flags.get(key);
    if (!flag) {
      return this.config.defaults[key] ?? false;
    }

    if (!flag.enabled) return false;

    return this.evaluateRules(flag);
  }

  getVariant(key: string): FlagVariant | null {
    const flag = this.flags.get(key);
    if (!flag?.variants?.length) return null;
    if (!this.isEnabled(key)) return null;

    const hash = this.hashString(
      `${flag.key}:${this.context.userId ?? "anonymous"}`
    );
    const total = flag.variants.reduce((sum, v) => sum + v.weight, 0);
    let cumulative = 0;

    for (const variant of flag.variants) {
      cumulative += variant.weight;
      if ((hash % total) < cumulative) return variant;
    }

    return flag.variants[flag.variants.length - 1] ?? null;
  }

  on(key: string, callback: (enabled: boolean) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  getAllFlags(): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    for (const [key] of this.flags) {
      result[key] = this.isEnabled(key);
    }
    return result;
  }

  override(key: string, enabled: boolean): void {
    const flag = this.flags.get(key);
    if (flag) {
      flag.enabled = enabled;
    } else {
      this.flags.set(key, {
        key,
        enabled,
        defaultValue: enabled,
      });
    }
  }

  shutdown(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

let flagService: FeatureFlagService | null = null;

export function getFeatureFlags(
  config?: Partial<FeatureFlagConfig>
): FeatureFlagService {
  if (!flagService) {
    flagService = new FeatureFlagService(config);
  }
  return flagService;
}

export function isFeatureEnabled(key: string): boolean {
  return getFeatureFlags().isEnabled(key);
}

export { FeatureFlagService };
export type { FeatureFlag, FlagRule, FlagVariant, EvaluationContext };
