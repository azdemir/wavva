"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: "light", toggle: () => {} });

const STORAGE_KEY = "tidypro-theme";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/** Reads the initial theme (same logic as the inline script in layout). */
function initialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // Sync with the class the inline script already applied (avoids FOUC
  // mismatches when the stored/system theme is dark).
  useEffect(() => {
    setTheme(
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      applyTheme(next);
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  // Render children immediately; only the toggle icon waits for mount.
  return (
    <ThemeContext.Provider value={{ theme: mounted ? theme : initialTheme(), toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Inline script for <head>: applies the stored/system theme before first
 * paint so there's no light-flash on load. Must stay in sync with
 * initialTheme() above.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`;
