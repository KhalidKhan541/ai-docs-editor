"use client";

import * as React from "react";

function usePrevious<T>(value: T): T | undefined {
  const ref = React.useRef<T | undefined>(undefined);

  React.useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

function usePreviousDistinct<T>(value: T, compare?: (a: T, b: T) => boolean): T | undefined {
  const ref = React.useRef<T | undefined>(undefined);
  const currentRef = React.useRef<T>(value);

  React.useEffect(() => {
    const isEqual = compare
      ? compare(currentRef.current, value)
      : currentRef.current === value;

    if (!isEqual) {
      ref.current = currentRef.current;
      currentRef.current = value;
    }
  }, [value, compare]);

  return ref.current;
}

export { usePrevious, usePreviousDistinct };
