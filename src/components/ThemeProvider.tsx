import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";
const KEY = "cookbuddy:theme";

interface Ctx { theme: Theme; setTheme: (t: Theme) => void; hasChosen: boolean; }
const ThemeCtx = createContext<Ctx>({ theme: "light", setTheme: () => {}, hasChosen: false });

export const useTheme = () => useContext(ThemeCtx);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [hasChosen, setHasChosen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(KEY) as Theme | null;
    if (saved === "light" || saved === "dark") {
      setThemeState(saved);
      setHasChosen(true);
      document.documentElement.classList.toggle("dark", saved === "dark");
    } else {
      // default light, but don't mark chosen
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial: Theme = prefersDark ? "dark" : "light";
      setThemeState(initial);
      document.documentElement.classList.toggle("dark", initial === "dark");
    }
  }, []);

  const setTheme = (t: Theme) => {
    localStorage.setItem(KEY, t);
    setThemeState(t);
    setHasChosen(true);
    document.documentElement.classList.toggle("dark", t === "dark");
  };

  return <ThemeCtx.Provider value={{ theme, setTheme, hasChosen }}>{children}</ThemeCtx.Provider>;
}
