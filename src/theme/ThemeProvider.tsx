import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { ColorScheme, darkColors, lightColors } from "./colors";

export type ThemeMode = "light" | "dark";
const STORAGE_KEY = "qln_theme_mode_v1";

type ThemeValue = {
  mode: ThemeMode;
  colors: ColorScheme;
  toggle: () => void;
  setMode: (m: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === "light" || saved === "dark") setModeState(saved);
    });
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
  };

  const value = useMemo<ThemeValue>(
    () => ({
      mode,
      colors: mode === "dark" ? darkColors : lightColors,
      toggle: () => setMode(mode === "dark" ? "light" : "dark"),
      setMode,
    }),
    [mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

/** Current palette. Use in components instead of importing the static `colors`. */
export function useColors(): ColorScheme {
  return useTheme().colors;
}

/** Theme mode + controls (for the settings toggle). */
export function useThemeMode() {
  const { mode, toggle, setMode } = useTheme();
  return { mode, toggle, setMode };
}
