import { useRef, useEffect } from "react";

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

export function usePreviousDistinct<T>(
  value: T,
  compare?: (a: T, b: T) => boolean
): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  const currentRef = useRef<T>(value);

  useEffect(() => {
    const compareFn = compare ?? ((a, b) => a === b);
    if (!compareFn(currentRef.current, value)) {
      ref.current = currentRef.current;
      currentRef.current = value;
    }
  }, [value, compare]);

  return ref.current;
}
