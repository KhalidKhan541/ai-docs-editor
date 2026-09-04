"use client";

import * as React from "react";

function useToggle(initialValue = false): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = React.useState(initialValue);

  const toggle = React.useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  const setValueDirect = React.useCallback((newValue: boolean) => {
    setValue(newValue);
  }, []);

  return [value, toggle, setValueDirect];
}

function useCounter(
  initialValue = 0,
  options?: { min?: number; max?: number; step?: number }
): {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  set: (value: number) => void;
} {
  const { min = -Infinity, max = Infinity, step = 1 } = options || {};
  const [count, setCount] = React.useState(initialValue);

  const increment = React.useCallback(() => {
    setCount((prev) => Math.min(prev + step, max));
  }, [step, max]);

  const decrement = React.useCallback(() => {
    setCount((prev) => Math.max(prev - step, min));
  }, [step, min]);

  const reset = React.useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  const set = React.useCallback(
    (value: number) => {
      setCount(Math.max(min, Math.min(max, value)));
    },
    [min, max]
  );

  return { count, increment, decrement, reset, set };
}

export { useToggle, useCounter };
