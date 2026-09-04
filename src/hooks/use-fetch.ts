import { useState, useCallback, useEffect, useRef } from "react";

interface UseFetchOptions<T> {
  immediate?: boolean;
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  retries?: number;
  retryDelay?: number;
}

interface UseFetchResult<T> {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  execute: (...args: unknown[]) => Promise<T | undefined>;
  reset: () => void;
}

export function useFetch<T>(
  fetcher: (...args: unknown[]) => Promise<T>,
  options: UseFetchOptions<T> = {}
): UseFetchResult<T> {
  const {
    immediate = false,
    initialData,
    onSuccess,
    onError,
    retries = 0,
    retryDelay = 1000,
  } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(immediate);
  const fetcherRef = useRef(fetcher);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | undefined> => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const result = await fetcherRef.current(...args);

          if (!mountedRef.current) return undefined;

          setData(result);
          setIsLoading(false);
          onSuccess?.(result);
          return result;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));

          if (!mountedRef.current) return undefined;

          if (attempt < retries) {
            await new Promise((resolve) =>
              setTimeout(resolve, retryDelay * (attempt + 1))
            );
          }
        }
      }

      if (mountedRef.current && lastError) {
        setError(lastError);
        setIsLoading(false);
        onError?.(lastError);
      }

      return undefined;
    },
    [retries, retryDelay, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setIsLoading(false);
  }, [initialData]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    data,
    error,
    isLoading,
    isSuccess: !isLoading && !error && data !== undefined,
    isError: !isLoading && error !== null,
    execute,
    reset,
  };
}
