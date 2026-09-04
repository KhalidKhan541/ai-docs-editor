"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string;
  enableSystem?: boolean;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
  themes: Theme[];
}

const ThemeContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "app-theme",
  attribute = "data-theme",
  enableSystem = true,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    try {
      return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    let resolved: "light" | "dark";

    if (theme === "system" && enableSystem) {
      const systemDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      resolved = systemDark ? "dark" : "light";
    } else {
      resolved = theme === "dark" ? "dark" : "light";
    }

    root.classList.add(resolved);
    root.setAttribute(attribute, resolved);
    setResolvedTheme(resolved);
  }, [theme, attribute, enableSystem]);

  useEffect(() => {
    if (theme !== "system" || !enableSystem) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      const root = window.document.documentElement;
      const isDark = mediaQuery.matches;

      root.classList.remove("light", "dark");
      root.classList.add(isDark ? "dark" : "light");
      root.setAttribute(attribute, isDark ? "dark" : "light");
      setResolvedTheme(isDark ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, attribute, enableSystem]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key !== storageKey) return;
      const newTheme = (e.newValue as Theme) || defaultTheme;
      setThemeState(newTheme);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [storageKey, defaultTheme]);

  const setTheme = (newTheme: Theme) => {
    try {
      localStorage.setItem(storageKey, newTheme);
    } catch {
      // Storage unavailable
    }
    setThemeState(newTheme);
  };

  const themes: Theme[] = enableSystem
    ? ["light", "dark", "system"]
    : ["light", "dark"];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        resolvedTheme,
        themes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeProviderState {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}

export function useThemeMode(): "light" | "dark" {
  const { resolvedTheme } = useTheme();
  return resolvedTheme;
}
