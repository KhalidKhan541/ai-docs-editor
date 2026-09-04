import { useState, useCallback } from "react";

export function useToggle(
  initialValue = false
): [boolean, { on: () => void; off: () => void; toggle: () => void; set: (value: boolean) => void }] {
  const [value, setValue] = useState(initialValue);

  const on = useCallback(() => setValue(true), []);
  const off = useCallback(() => setValue(false), []);
  const toggle = useCallback(() => setValue((v) => !v), []);
  const set = useCallback((v: boolean) => setValue(v), []);

  return [value, { on, off, toggle, set }];
}

export function useCounter(
  initialValue = 0,
  options?: { min?: number; max?: number; step?: number }
): [number, { increment: () => void; decrement: () => void; reset: () => void; set: (value: number) => void }] {
  const { min = -Infinity, max = Infinity, step = 1 } = options ?? {};
  const [value, setValue] = useState(initialValue);

  const increment = useCallback(
    () => setValue((v) => Math.min(v + step, max)),
    [step, max]
  );

  const decrement = useCallback(
    () => setValue((v) => Math.max(v - step, min)),
    [step, min]
  );

  const reset = useCallback(() => setValue(initialValue), [initialValue]);

  const set = useCallback(
    (v: number) => setValue(Math.max(min, Math.min(max, v))),
    [min, max]
  );

  return [value, { increment, decrement, reset, set }];
}

export function useBoolean(
  initialValue = false
): [boolean, { setTrue: () => void; setFalse: () => void; toggle: () => void }] {
  const [value, setValue] = useState(initialValue);

  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  const toggle = useCallback(() => setValue((v) => !v), []);

  return [value, { setTrue, setFalse, toggle }];
}
