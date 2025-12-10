"use client";

import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  TextField,
  Button,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Topbar() {
  const pathname = usePathname();

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
        borderBottom: "1px solid rgba(148,163,184,0.2)",
        bgcolor: "rgba(15,23,42,0.9)",
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
          <TextField
            size="small"
            placeholder="Buscar cliente, préstamo, DNI…"
            variant="outlined"
            sx={{
              minWidth: 260,
              "& .MuiOutlinedInput-root": {
                borderRadius: 999,
                bgcolor: "rgba(15,23,42,0.9)",
              },
            }}
          />
          <Button
            component={Link}
            href="/prestamos"
            size="small"
            sx={{
              borderRadius: 999,
              textTransform: "none",
              px: 2,
              bgcolor: "linear-gradient(to right, #38bdf8, #22c55e)",
            }}
            variant="contained"
          >
            + Nuevo préstamo
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
