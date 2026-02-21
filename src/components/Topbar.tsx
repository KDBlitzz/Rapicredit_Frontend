"use client";

import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { DarkMode, LightMode } from "@mui/icons-material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useColorMode } from "../app/ThemeRegistry";
import { useEmpleadoActual } from "../hooks/useEmpleadoActual";

export default function Topbar() {
  const pathname = usePathname();
  const theme = useTheme();
  const { mode, toggleColorMode } = useColorMode();
  const { empleado } = useEmpleadoActual();

  const permisosActuales = (empleado?.permisos || []).map((p) => p.toUpperCase());
  const canGestionarSolicitudes = permisosActuales.includes("F010");

  const showNuevaSolicitud = !pathname.startsWith("/prestamos") && !pathname.startsWith("/solicitudes");

  const title = (() => {
    if (pathname.startsWith("/solicitudes")) return "Solicitudes";
    if (pathname.startsWith("/prestamos")) return "Préstamos";
    if (pathname.startsWith("/clientes")) return "Clientes";
    if (pathname.startsWith("/pagos")) return "Pagos";
    if (pathname.startsWith("/empleados/estadisticas")) return "Estadísticas";
    if (pathname.startsWith("/empleados")) return "Empleados";
    if (pathname.startsWith("/cobradores")) return "Cobradores";
    if (pathname.startsWith("/carteras")) return "Carteras";
    if (pathname.startsWith("/reportes")) return "Reportes";
    if (pathname.startsWith("/tasas")) return "Tasas";
    if (pathname.startsWith("/configuracion")) return "Configuración";
    if (pathname.startsWith("/dashboard")) return "Dashboard";
    return "Dashboard";
  })();

  return (
    <AppBar
      position="static"
      color="transparent"
      elevation={0}
      sx={{
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor:
          theme.palette.mode === "light"
            ? alpha(theme.palette.success.main, 0.12)
            : alpha(theme.palette.background.paper, 0.9),
        backdropFilter: "blur(16px)",
        color: theme.palette.text.primary,
      }}
    >
      <Toolbar sx={{ minHeight: 64, px: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500, color: "text.primary" }}>
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

          {showNuevaSolicitud && canGestionarSolicitudes ? (
            <Button
              component={Link}
              href="/solicitudes"
              size="small"
              sx={{
                borderRadius: 999,
                textTransform: "none",
                px: 2,
                bgcolor: theme.palette.success.main,
                "&:hover": {
                  bgcolor: theme.palette.success.dark,
                },
              }}
              variant="contained"
            >
              + Nueva solicitud
            </Button>
          ) : null}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
