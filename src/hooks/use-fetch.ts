"use client";

import * as React from "react";

interface UseFetchOptions<T> {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: unknown;
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseFetchResult<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  execute: (customBody?: unknown) => Promise<T | null>;
  reset: () => void;
}

function useFetch<T>(
  url: string | null,
  options?: UseFetchOptions<T>
): UseFetchResult<T> {
  const {
    method = "GET",
    headers = {},
    body,
    immediate = true,
    onSuccess,
    onError,
  } = options || {};

  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const execute = React.useCallback(
    async (customBody?: unknown): Promise<T | null> => {
      if (!url) return null;

      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        const requestOptions: RequestInit = {
          method,
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          signal: abortControllerRef.current.signal,
        };

        if (method !== "GET" && (customBody || body)) {
          requestOptions.body = JSON.stringify(customBody || body);
        }

        const response = await fetch(url, requestOptions);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: T = await response.json();
        setData(result);
        setLoading(false);
        onSuccess?.(result);
        return result;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return null;
        }
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setLoading(false);
        onError?.(error);
        return null;
      }
    },
    [url, method, headers, body, onSuccess, onError]
  );

  const reset = React.useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    if (immediate && url) {
      execute();
    }

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [url, immediate]);

  return { data, error, loading, execute, reset };
}

function useMutation<TData, TVariables = unknown>(
  url: string,
  options?: {
    method?: "POST" | "PUT" | "DELETE" | "PATCH";
    headers?: Record<string, string>;
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
  }
): {
  mutate: (variables: TVariables) => Promise<TData | null>;
  data: TData | null;
  error: Error | null;
  loading: boolean;
  reset: () => void;
} {
  const [data, setData] = React.useState<TData | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);

  const mutate = React.useCallback(
    async (variables: TVariables): Promise<TData | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url, {
          method: options?.method || "POST",
          headers: {
            "Content-Type": "application/json",
            ...options?.headers,
          },
          body: JSON.stringify(variables),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: TData = await response.json();
        setData(result);
        setLoading(false);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setLoading(false);
        options?.onError?.(error);
        return null;
      }
    },
    [url, options]
  );

  const reset = React.useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { mutate, data, error, loading, reset };
}

export { useFetch, useMutation };
