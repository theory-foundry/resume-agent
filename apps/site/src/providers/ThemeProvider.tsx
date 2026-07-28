"use client";
import { ReactNode, createContext, useContext, useState } from "react";

export const ThemeContext = createContext<{
  theme: string;
  setTheme: (theme: string) => void;
}>({
  theme: "dark",
  setTheme: () => undefined,
});

export function useThemeContext() {
  const value = useContext(ThemeContext);
  return value;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState("dark");

  const value = {
    theme,
    setTheme: setTheme
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
