import { useEffect, useRef, useCallback } from "react";

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  interval?: number;
  enabled?: boolean;
  onError?: (error: Error) => void;
}

interface UseAutoSaveResult {
  save: () => Promise<void>;
  lastSaved: Date | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

export function useAutoSave<T>({
  data,
  onSave,
  interval = 30_000,
  enabled = true,
  onError,
}: UseAutoSaveOptions<T>): UseAutoSaveResult {
  const savedDataRef = useRef<string>("");
  const lastSavedRef = useRef<Date | null>(null);
  const isSavingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const save = useCallback(async () => {
    if (isSavingRef.current) return;

    const currentData = dataRef.current;
    const serialized = JSON.stringify(currentData);

    if (serialized === savedDataRef.current) return;

    isSavingRef.current = true;

    try {
      await onSave(currentData);
      savedDataRef.current = serialized;
      lastSavedRef.current = new Date();
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave, onError]);

  useEffect(() => {
    if (!enabled) return;

    timerRef.current = setInterval(save, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, interval, save]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const currentData = dataRef.current;
      const serialized = JSON.stringify(currentData);

      if (serialized !== savedDataRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () =>
        window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, []);

  const hasUnsavedChanges =
    JSON.stringify(data) !== savedDataRef.current && savedDataRef.current !== "";

  return {
    save,
    lastSaved: lastSavedRef.current,
    isSaving: isSavingRef.current,
    hasUnsavedChanges,
  };
}
