import { useState, useCallback, useEffect } from "react";

interface UseLocalStorageOptions<T> {
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
  onError?: (error: Error) => void;
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T)
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const {
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    onError = console.error,
  } = {} as UseLocalStorageOptions<T>;

  const getInitialValue = useCallback((): T => {
    try {
      if (typeof window === "undefined") return getResolvedInitial();
      const item = window.localStorage.getItem(key);
      return item !== null ? deserializer(item) : getResolvedInitial();
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
      return getResolvedInitial();
    }
  }, [key, deserializer, onError]);

  const getResolvedInitial = (): T => {
    return initialValue instanceof Function ? initialValue() : initialValue;
  };

  const [storedValue, setStoredValue] = useState<T>(getInitialValue);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue((prev) => {
          const valueToStore = value instanceof Function ? value(prev) : value;
          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, serializer(valueToStore));
          }
          return valueToStore;
        });
      } catch (error) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    },
    [key, serializer, onError]
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(getResolvedInitial());
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [key, onError]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== key) return;
      try {
        const newValue = e.newValue
          ? deserializer(e.newValue)
          : getResolvedInitial();
        setStoredValue(newValue);
      } catch {
        // ignore parse errors from other tabs
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }
  }, [key, deserializer]);

  return [storedValue, setValue, removeValue];
}
