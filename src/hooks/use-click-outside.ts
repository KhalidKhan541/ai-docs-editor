import { useEffect, useRef, type RefObject } from "react";

export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: () => void,
  options?: {
    enabled?: boolean;
    exclude?: RefObject<HTMLElement>[];
  }
): RefObject<T> {
  const ref = useRef<T>(null);
  const handlerRef = useRef(handler);
  const { enabled = true, exclude = [] } = options ?? {};

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (ref.current?.contains(target)) return;

      for (const excludedRef of exclude) {
        if (excludedRef.current?.contains(target)) return;
      }

      handlerRef.current();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handlerRef.current();
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [enabled, exclude]);

  return ref;
}
