"use client";

import * as React from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import type { PaletteMode } from "@mui/material/styles";
import { createAppTheme } from "../theme/theme";

type ColorModeContextValue = {
  mode: PaletteMode;
  toggleColorMode: () => void;
  setMode: (mode: PaletteMode) => void;
};

export const ColorModeContext = React.createContext<ColorModeContextValue>({
  mode: "dark",
  toggleColorMode: () => {},
  setMode: () => {},
});

export function useColorMode() {
  return React.useContext(ColorModeContext);
}

const STORAGE_KEY = "rapicredit-color-mode";

export default function ThemeRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, setMode] = React.useState<PaletteMode>("dark");

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        setMode(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  const colorMode = React.useMemo<ColorModeContextValue>(() => {
    return {
      mode,
      setMode: (m) => {
        setMode(m);
        try {
          window.localStorage.setItem(STORAGE_KEY, m);
        } catch {
          // ignore
        }
      },
      toggleColorMode: () => {
        setMode((prev) => {
          const next: PaletteMode = prev === "light" ? "dark" : "light";
          try {
            window.localStorage.setItem(STORAGE_KEY, next);
          } catch {
            // ignore
          }
          return next;
        });
      },
    };
  }, [mode]);

  const theme = React.useMemo(() => createAppTheme(mode), [mode]);

  return (
    <AppRouterCacheProvider options={{ key: "mui", prepend: true }}>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </ColorModeContext.Provider>
    </AppRouterCacheProvider>
  );
}
