"use client";

import * as React from "react";

type Key = string | string[];
type Callback = (event: KeyboardEvent) => void;

interface UseKeyPressOptions {
  enabled?: boolean;
  target?: EventTarget | null;
  useCapture?: boolean;
}

function useKeyPress(
  key: Key,
  callback: Callback,
  options?: UseKeyPressOptions
): void {
  const { enabled = true, target = null, useCapture = true } = options || {};

  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const keys = Array.isArray(key) ? key : [key];
      if (keys.includes(event.key)) {
        callback(event);
      }
    };

    const targetElement = target || document;
    targetElement.addEventListener("keydown", handleKeyDown, useCapture);

    return () => {
      targetElement.removeEventListener("keydown", handleKeyDown, useCapture);
    };
  }, [key, callback, enabled, target, useCapture]);
}

function useKeyPressMultiple(
  keyMap: Record<string, Callback>,
  options?: UseKeyPressOptions
): void {
  const { enabled = true, target = null, useCapture = true } = options || {};

  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const callback = keyMap[event.key];
      if (callback) {
        callback(event);
      }
    };

    const targetElement = target || document;
    targetElement.addEventListener("keydown", handleKeyDown, useCapture);

    return () => {
      targetElement.removeEventListener("keydown", handleKeyDown, useCapture);
    };
  }, [keyMap, enabled, target, useCapture]);
}

function useEscapeKey(callback: Callback, enabled = true): void {
  useKeyPress("Escape", callback, { enabled });
}

function useEnterKey(callback: Callback, enabled = true): void {
  useKeyPress("Enter", callback, { enabled });
}

function useArrowKeys(
  callbacks: {
    up?: Callback;
    down?: Callback;
    left?: Callback;
    right?: Callback;
  },
  enabled = true
): void {
  useKeyPressMultiple(
    {
      ArrowUp: callbacks.up || (() => {}),
      ArrowDown: callbacks.down || (() => {}),
      ArrowLeft: callbacks.left || (() => {}),
      ArrowRight: callbacks.right || (() => {}),
    },
    { enabled }
  );
}

export {
  useKeyPress,
  useKeyPressMultiple,
  useEscapeKey,
  useEnterKey,
  useArrowKeys,
};
