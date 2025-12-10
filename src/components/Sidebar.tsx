"use client";

import {
  Box,
  Typography,
  Divider,
  List,
  ListSubheader,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    section: "General",
    items: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Tasas", href: "/tasas" },
      { label: "Préstamos", href: "/prestamos" },
      { label: "Clientes", href: "/clientes" },
      { label: "Pagos", href: "/pagos" },
      { label: "Solicitudes", href: "/solicitudes" },
    ],
  },
  {
    section: "Personal",
    items: [
      { label: "Empleados", href: "/empleados" },
    ],
  },
  {
    section: "Análisis",
    items: [{ label: "Reportes", href: "/reportes" }],
  },
  {
    section: "Sistema",
    items: [{ label: "Configuración", href: "/configuracion" }],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <Box
      component="aside"
      sx={{
        width: 260,
        borderRight: "1px solid rgba(148,163,184,0.25)",
        bgcolor: "background.paper",
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        p: 2,
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="overline"
          sx={{
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "primary.main",
            fontWeight: 700,
          }}
        >
          RapiCredit
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Panel de administración
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto" }}>
        {navItems.map((section) => (
          <List
            key={section.section}
            dense
            subheader={
              <ListSubheader
                sx={{
                  bgcolor: "transparent",
                  color: "text.secondary",
                  textTransform: "uppercase",
                  letterSpacing: ".12em",
                  fontSize: 11,
                  px: 0,
                }}
              >
                {section.section}
              </ListSubheader>
            }
          >
            {section.items.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <ListItemButton
                  key={item.href}
                  component={Link}
                  href={item.href}
                  selected={active}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    "&.Mui-selected": {
                      bgcolor: "rgba(56,189,248,0.18)",
                    },
                    "&:hover": {
                      bgcolor: "rgba(148,163,184,0.12)",
                    },
                  }}
                >
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: 14,
                      color: active ? "text.primary" : "text.secondary",
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        ))}
      </Box>

      <Divider sx={{ my: 1 }} />
      <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mr: 1.5,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          A
        </Box>
        <Box>
          <Typography variant="body2">Admin</Typography>
          <Typography variant="caption" color="text.secondary">
            Gerente
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
