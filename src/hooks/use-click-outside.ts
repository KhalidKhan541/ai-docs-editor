"use client";

import * as React from "react";

function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: (event: MouseEvent | TouchEvent) => void,
  options?: {
    enabled?: boolean;
    nodes?: Array<React.RefObject<T>>;
  }
): React.RefObject<T> {
  const ref = React.useRef<T>(null);
  const { enabled = true, nodes = [] } = options || {};

  React.useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (ref.current && ref.current.contains(target)) {
        return;
      }

      for (const node of nodes) {
        if (node.current && node.current.contains(target)) {
          return;
        }
      }

      handler(event);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [handler, enabled, nodes]);

  return ref;
}

export { useClickOutside };
