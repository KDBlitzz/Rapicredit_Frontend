"use client";

import { createTheme, type PaletteMode } from "@mui/material/styles";

export function createAppTheme(mode: PaletteMode) {
  return createTheme({
    palette: {
      mode,
      ...(mode === "dark"
        ? {
            background: {
              default: "#020617",
              paper: "#020617",
            },
          }
        : {}),
      primary: {
        main: "#38bdf8",
      },
      secondary: {
        main: "#22c55e",
      },
    },
    shape: {
      borderRadius: 16,
    },
    typography: {
      fontFamily: [
        "system-ui",
        "-apple-system",
        "BlinkMacSystemFont",
        '"SF Pro Text"',
        '"Segoe UI"',
        "sans-serif",
      ].join(","),
    },
    components: {
      MuiPaper: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundImage: "none",
            borderRadius: 16,
            border: "1px solid rgba(148,163,184,0.2)",
          },
        },
      },
    },
  });
}
const theme = createAppTheme("dark");
export default theme;
