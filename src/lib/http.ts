interface HTTPConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  headers: Record<string, string>;
}

interface RequestOptions extends Omit<RequestInit, "method" | "body"> {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  signal?: AbortSignal;
}

interface ResponseWrapper<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

interface RetryConfig {
  retries: number;
  delay: number;
  backoff: number;
  retryOn: number[];
}

const DEFAULT_CONFIG: HTTPConfig = {
  baseURL: "",
  timeout: 30_000,
  retries: 3,
  retryDelay: 1_000,
  headers: {
    "Content-Type": "application/json",
  },
};

let globalConfig: HTTPConfig = { ...DEFAULT_CONFIG };

function buildURL(
  baseURL: string,
  url: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  const base = baseURL.replace(/\/+$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  let fullUrl = `${base}${path}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) fullUrl += `?${qs}`;
  }

  return fullUrl;
}

function serializeBody(body: unknown): string | FormData | undefined {
  if (body === undefined || body === null) return undefined;
  if (body instanceof FormData) return body;
  if (body instanceof URLSearchParams) return body;
  if (typeof body === "string") return body;
  return JSON.stringify(body);
}

function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token");
  }
  return process.env.API_TOKEN ?? null;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function retryFetch(
  url: string,
  options: RequestInit,
  config: RetryConfig
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, 30_000);

      if (config.retryOn.includes(response.status) && attempt < config.retries) {
        await sleep(config.delay * Math.pow(config.backoff, attempt));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < config.retries) {
        await sleep(config.delay * Math.pow(config.backoff, attempt));
      }
    }
  }

  throw lastError ?? new Error("Request failed after retries");
}

async function request<T>(
  method: string,
  url: string,
  options: RequestOptions = {}
): Promise<ResponseWrapper<T>> {
  const {
    params,
    body,
    timeout = globalConfig.timeout,
    retries = globalConfig.retries,
    retryDelay = globalConfig.retryDelay,
    signal,
    headers: customHeaders,
    ...fetchOptions
  } = options;

  const fullURL = buildURL(globalConfig.baseURL, url, params);
  const token = getAuthToken();

  const headers: Record<string, string> = {
    ...globalConfig.headers,
    ...customHeaders,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const serializedBody = serializeBody(body);
  if (serializedBody && typeof serializedBody === "string") {
    headers["Content-Type"] = "application/json";
  }

  const requestInit: RequestInit = {
    method,
    headers,
    body: serializedBody,
    ...fetchOptions,
  };

  if (signal) {
    (requestInit as { signal: AbortSignal }).signal = signal;
  }

  const response = await retryFetch(fullURL, requestInit, {
    retries,
    delay: retryDelay,
    backoff: 2,
    retryOn: [408, 429, 500, 502, 503, 504],
  });

  let data: T;
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    data = (await response.json()) as T;
  } else {
    data = (await response.text()) as unknown as T;
  }

  if (!response.ok) {
    const error = data as unknown as { message?: string; error?: string };
    throw new HTTPError(
      error?.message ?? error?.error ?? `HTTP ${response.status}`,
      response.status,
      response.statusText
    );
  }

  return {
    data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  };
}

export class HTTPError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message);
    this.name = "HTTPError";
  }
}

export function configureHTTP(config: Partial<HTTPConfig>): void {
  globalConfig = { ...globalConfig, ...config };
}

export const http = {
  get: <T>(url: string, options?: RequestOptions) =>
    request<T>("GET", url, options),

  post: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", url, { ...options, body }),

  put: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", url, { ...options, body }),

  patch: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", url, { ...options, body }),

  delete: <T>(url: string, options?: RequestOptions) =>
    request<T>("DELETE", url, options),
};

export function createHTTPClient(baseURL: string, headers?: Record<string, string>) {
  configureHTTP({ baseURL, headers: { ...globalConfig.headers, ...headers } });
  return http;
}

export default http;
