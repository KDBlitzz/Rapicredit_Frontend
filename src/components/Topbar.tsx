"use client";

import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  TextField,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { DarkMode, LightMode } from "@mui/icons-material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useColorMode } from "../app/ThemeRegistry";

export default function Topbar() {
  const pathname = usePathname();
  const theme = useTheme();
  const { mode, toggleColorMode } = useColorMode();

  const title = (() => {
    if (pathname.startsWith("/prestamos")) return "Préstamos";
    if (pathname.startsWith("/clientes")) return "Clientes";
    if (pathname.startsWith("/pagos")) return "Pagos";
    if (pathname.startsWith("/reportes")) return "Reportes";
    if (pathname.startsWith("/tasas")) return "Tasas";
    if (pathname.startsWith("/configuracion")) return "Configuración";
    return "Dashboard";
  })();

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.background.paper, 0.9),
        backdropFilter: "blur(16px)",
      }}
    >
      <Toolbar sx={{ minHeight: 64, px: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            RapiCredit · Panel interno
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Tooltip title={mode === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>
            <IconButton size="small" onClick={toggleColorMode} color="inherit">
              {mode === "dark" ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
            </IconButton>
          </Tooltip>

          <TextField
            size="small"
            placeholder="Buscar cliente, préstamo, DNI…"
            variant="outlined"
            sx={{
              minWidth: 260,
              "& .MuiOutlinedInput-root": {
                borderRadius: 999,
                bgcolor: alpha(theme.palette.background.paper, 0.7),
              },
            }}
          />
          <Button
            component={Link}
            href="/solicitudes"
            size="small"
            sx={{
              borderRadius: 999,
              textTransform: "none",
              px: 2,
              background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            }}
            variant="contained"
          >
            + Nueva solicitud
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
