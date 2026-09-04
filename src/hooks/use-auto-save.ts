"use client";

import * as React from "react";

interface UseAutoSaveOptions<T> {
  value: T;
  onSave: (value: T) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

interface UseAutoSaveResult {
  isSaving: boolean;
  lastSaved: Date | null;
  error: Error | null;
  save: () => Promise<void>;
}

function useAutoSave<T>({
  value,
  onSave,
  delay = 1000,
  enabled = true,
}: UseAutoSaveOptions<T>): UseAutoSaveResult {
  const [isSaving, setIsSaving] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const valueRef = React.useRef<T>(value);
  const onSaveRef = React.useRef(onSave);

  valueRef.current = value;
  onSaveRef.current = onSave;

  const save = React.useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      await onSaveRef.current(valueRef.current);
      setLastSaved(new Date());
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setIsSaving(false);
    }
  }, []);

  React.useEffect(() => {
    if (!enabled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      save();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay, enabled, save]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { isSaving, lastSaved, error, save };
}

export { useAutoSave };
