import { useState, useEffect, useCallback, useRef } from "react";

interface UseKeyPressOptions {
  target?: React.RefObject<HTMLElement>;
  enabled?: boolean;
}

export function useKeyPress(
  key: string | string[],
  callback: (event: KeyboardEvent) => void,
  options?: UseKeyPressOptions
): boolean {
  const [isPressed, setIsPressed] = useState(false);
  const callbackRef = useRef(callback);
  const { target, enabled = true } = options ?? {};

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const targetElement = target?.current ?? document;

    const handleKeyDown = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      const keys = Array.isArray(key) ? key : [key];

      const matches = keys.some((k) => {
        const parts = k.toLowerCase().split("+");
        const mainKey = parts[parts.length - 1];
        const needsCtrl = parts.includes("ctrl") || parts.includes("control");
        const needsShift = parts.includes("shift");
        const needsAlt = parts.includes("alt");
        const needsMeta = parts.includes("meta") || parts.includes("cmd");

        return (
          keyboardEvent.key.toLowerCase() === mainKey &&
          keyboardEvent.ctrlKey === needsCtrl &&
          keyboardEvent.shiftKey === needsShift &&
          keyboardEvent.altKey === needsAlt &&
          keyboardEvent.metaKey === needsMeta
        );
      };

      if (matches) {
        setIsPressed(true);
        callbackRef.current(keyboardEvent);
      }
    };

    const handleKeyUp = (event: Event) => {
      const keys = Array.isArray(key) ? key : [key];
      const matches = keys.some(
        (k) => (event as KeyboardEvent).key.toLowerCase() === k.toLowerCase()
      );
      if (matches) setIsPressed(false);
    };

    targetElement.addEventListener("keydown", handleKeyDown);
    targetElement.addEventListener("keyup", handleKeyUp);

    return () => {
      targetElement.removeEventListener("keydown", handleKeyDown);
      targetElement.removeEventListener("keyup", handleKeyUp);
    };
  }, [key, target, enabled]);

  return isPressed;
}

export function useKeyCombo(
  combo: string,
  callback: (event: KeyboardEvent) => void,
  options?: UseKeyPressOptions
): void {
  const { target, enabled = true } = options ?? {};
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const targetElement = target?.current ?? document;

    const handleKeyDown = (event: Event) => {
      const e = event as KeyboardEvent;
      const parts = combo.toLowerCase().split("+");
      const mainKey = parts[parts.length - 1];

      const needsCtrl = parts.includes("ctrl") || parts.includes("control");
      const needsShift = parts.includes("shift");
      const needsAlt = parts.includes("alt");
      const needsMeta = parts.includes("meta") || parts.includes("cmd");

      if (
        e.key.toLowerCase() === mainKey &&
        e.ctrlKey === needsCtrl &&
        e.shiftKey === needsShift &&
        e.altKey === needsAlt &&
        e.metaKey === needsMeta
      ) {
        e.preventDefault();
        callbackRef.current(e);
      }
    };

    targetElement.addEventListener("keydown", handleKeyDown);
    return () => targetElement.removeEventListener("keydown", handleKeyDown);
  }, [combo, target, enabled]);
}
