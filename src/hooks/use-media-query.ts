"use client";

import * as React from "react";

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    setMatches(mediaQuery.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}

function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 768px)");
}

function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 768px) and (max-width: 1024px)");
}

function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}

function usePrefersDark(): boolean {
  return useMediaQuery("(prefers-color-scheme: dark)");
}

function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

export {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  usePrefersDark,
  usePrefersReducedMotion,
};
