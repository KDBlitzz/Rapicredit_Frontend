"use client";

import * as React from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { ThemeProvider, alpha } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
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
          <GlobalStyles
            styles={(t) => {
              const track = alpha(t.palette.background.paper, t.palette.mode === "light" ? 0.65 : 0.25);
              const thumb = alpha(t.palette.primary.main, t.palette.mode === "light" ? 0.38 : 0.32);
              const thumbHover = alpha(t.palette.primary.main, t.palette.mode === "light" ? 0.55 : 0.48);
              const border = alpha(t.palette.background.paper, t.palette.mode === "light" ? 0.8 : 0.4);

              return {
                "*": {
                  scrollbarWidth: "thin",
                  scrollbarColor: `${thumb} ${track}`,
                },
                "*::-webkit-scrollbar": {
                  width: 10,
                  height: 10,
                },
                "*::-webkit-scrollbar-track": {
                  backgroundColor: track,
                  borderRadius: 999,
                },
                "*::-webkit-scrollbar-thumb": {
                  backgroundColor: thumb,
                  borderRadius: 999,
                  border: `2px solid ${border}`,
                },
                "*::-webkit-scrollbar-thumb:hover": {
                  backgroundColor: thumbHover,
                },
                "*::-webkit-scrollbar-corner": {
                  backgroundColor: "transparent",
                },
              };
            }}
          />
          {children}
        </ThemeProvider>
      </ColorModeContext.Provider>
    </AppRouterCacheProvider>
  );
}
