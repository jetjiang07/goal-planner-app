"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  ACCENT_THEME_STORAGE_KEY,
  defaultAccentThemeId,
  isAccentThemeId,
  type AccentThemeId,
} from "@/lib/themes";

type ThemeContextValue = {
  accentTheme: AccentThemeId;
  setAccentTheme: (theme: AccentThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyAccentTheme(theme: AccentThemeId) {
  document.documentElement.dataset.accentTheme = theme;
}

function readStoredAccentTheme() {
  if (typeof window === "undefined") {
    return defaultAccentThemeId;
  }

  const storedTheme = window.localStorage.getItem(ACCENT_THEME_STORAGE_KEY);
  return isAccentThemeId(storedTheme) ? storedTheme : defaultAccentThemeId;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accentTheme, setAccentThemeState] = useState<AccentThemeId>(defaultAccentThemeId);

  useEffect(() => {
    const storedTheme = readStoredAccentTheme();
    setAccentThemeState(storedTheme);
    applyAccentTheme(storedTheme);
  }, []);

  const setAccentTheme = (theme: AccentThemeId) => {
    setAccentThemeState(theme);
    applyAccentTheme(theme);
    window.localStorage.setItem(ACCENT_THEME_STORAGE_KEY, theme);
  };

  const value = useMemo(
    () => ({
      accentTheme,
      setAccentTheme,
    }),
    [accentTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAccentTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useAccentTheme must be used within ThemeProvider.");
  }

  return context;
}
