"use client";

import { alpha, createTheme, type PaletteMode } from "@mui/material/styles";
import { blue, green, grey } from "@mui/material/colors";

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
            primary: {
              main: "#38bdf8",
            },
            secondary: {
              main: "#22c55e",
            },
            success: {
              main: "#22c55e",
            },
          }
        : {
            background: {
              default: grey[100],
              paper: "#fff",
            },
            primary: {
              main: green[700],
              dark: green[800],
            },
            secondary: {
              main: green[600],
              dark: green[700],
            },
            success: {
              main: green[700],
              dark: green[800],
            },
            info: {
              main: blue[700],
              dark: blue[800],
            },
            action: {
              hover: alpha(green[700], 0.12),
              selected: alpha(green[700], 0.16),
            },
          }),
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
          root: ({ theme }) => ({
            backgroundImage: "none",
            borderRadius: 16,
            border: `1px solid ${alpha(theme.palette.divider, theme.palette.mode === "light" ? 0.7 : 0.3)}`,
          }),
        },
      },

      MuiTableRow: {
        styleOverrides: {
          root: ({ theme }) => ({
            "&:not(.MuiTableRow-head):hover": {
              backgroundColor: alpha(theme.palette.success.main, theme.palette.mode === "light" ? 0.12 : 0.08),
            },
          }),
        },
      },

      MuiListItemButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 12,
            "&:hover": {
              backgroundColor: alpha(theme.palette.success.main, theme.palette.mode === "light" ? 0.16 : 0.12),
            },
            "&.Mui-selected": {
              backgroundColor: alpha(theme.palette.success.main, theme.palette.mode === "light" ? 0.22 : 0.16),
            },
          }),
        },
      },

      MuiIconButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            "&:hover": {
              backgroundColor: alpha(theme.palette.success.main, theme.palette.mode === "light" ? 0.14 : 0.10),
            },
          }),
        },
      },

      MuiTableCell: {
        styleOverrides: {
          head: ({ theme }) => ({
            ...(theme.palette.mode === "light"
              ? {
                  backgroundColor: alpha(theme.palette.success.main, 0.12),
                  fontWeight: 700,
                }
              : {}),
          }),
        },
      },

      MuiChip: {
        styleOverrides: {
          root: ({ theme }) =>
            theme.palette.mode === "light"
              ? {
                  "&.MuiChip-outlinedSuccess": {
                    backgroundColor: theme.palette.success.main,
                    borderColor: theme.palette.success.main,
                    color: theme.palette.success.contrastText,
                  },
                  "&.MuiChip-outlinedError": {
                    backgroundColor: theme.palette.error.main,
                    borderColor: theme.palette.error.main,
                    color: theme.palette.error.contrastText,
                  },
                  "&.MuiChip-outlinedWarning": {
                    backgroundColor: theme.palette.warning.main,
                    borderColor: theme.palette.warning.main,
                    color: theme.palette.warning.contrastText,
                  },
                  "&.MuiChip-outlinedInfo": {
                    backgroundColor: theme.palette.info.main,
                    borderColor: theme.palette.info.main,
                    color: theme.palette.info.contrastText,
                  },
                  "&.MuiChip-outlinedPrimary": {
                    backgroundColor: theme.palette.primary.main,
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                  },
                  "&.MuiChip-outlinedSecondary": {
                    backgroundColor: theme.palette.secondary.main,
                    borderColor: theme.palette.secondary.main,
                    color: theme.palette.secondary.contrastText,
                  },
                  "&.MuiChip-outlinedDefault": {
                    backgroundColor: alpha(theme.palette.text.primary, 0.08),
                    borderColor: alpha(theme.palette.text.primary, 0.12),
                    color: theme.palette.text.primary,
                  },
                }
              : {},
        },
      },

      MuiButton: {
        styleOverrides: {
          root: ({ theme }) =>
            theme.palette.mode === "light"
              ? {
                  "&.MuiButton-outlinedSuccess": {
                    backgroundColor: theme.palette.success.main,
                    borderColor: theme.palette.success.main,
                    color: theme.palette.success.contrastText,
                    "&:hover": {
                      backgroundColor: theme.palette.success.dark,
                      borderColor: theme.palette.success.dark,
                    },
                  },
                  "&.MuiButton-outlinedError": {
                    backgroundColor: theme.palette.error.main,
                    borderColor: theme.palette.error.main,
                    color: theme.palette.error.contrastText,
                    "&:hover": {
                      backgroundColor: theme.palette.error.dark,
                      borderColor: theme.palette.error.dark,
                    },
                  },
                }
              : {},
        },
      },
    },
  });
}
const theme = createAppTheme("dark");
export default theme;
