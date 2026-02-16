"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Divider,
  List,
  ListSubheader,
  ListItemButton,
  ListItemText,
  Collapse,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

type NavSubItem = { label: string; href: string };
type NavItem = NavSubItem & { submenu?: NavSubItem[] };
type NavSection = { section: string; items: NavItem[] };

const navItems: NavSection[] = [
  {
    section: "General",
    items: [
      { label: "Dashboard", href: "/dashboard" },      
      { label: "Préstamos", href: "/prestamos" },
      { label: "Pagos", href: "/pagos" },   
      { label: "Solicitudes", href: "/solicitudes" },
      { label: "Tasas", href: "/tasas" },
      { label: "Clientes", href: "/clientes" },         
    ],
  },
  {
    section: "Personal",
    items: [
      { label: "Empleados", href: "/empleados" },
      { label: "Gestión de Carteras", href: "/carteras" },
    ],
  },
  {
    section: "Análisis",
    items: [
      { 
        label: "Reportes", 
        href: "/reportes",
        submenu: [
          { label: "Central de Riesgos", href: "/reportes/central-riesgos" },
          { label: "Seguro de Vida", href: "/reportes/seguro-vida" },
          { label: "Pago al SAR", href: "/reportes/pago-sar" },
          { label: "Trazabilidad de decisiones", href: "/reportes/trazabilidad-decisiones" },
        ]
      },
      { label: "Estadísticas Asesor", href: "/empleados/estadisticas" }
    ],
  },
  {
    section: "Sistema",
    items: [{ label: "Configuración", href: "/configuracion" }],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const theme = useTheme();

  const isLight = theme.palette.mode === "light";
  const sidebarBg = useMemo(() => {
    return isLight ? theme.palette.success.dark : theme.palette.background.paper;
  }, [isLight, theme.palette.background.paper, theme.palette.success.dark]);

  const sidebarBorder = useMemo(() => {
    return `1px solid ${alpha(theme.palette.divider, isLight ? 0.6 : 0.3)}`;
  }, [theme.palette.divider, isLight]);

  const sidebarText = isLight ? theme.palette.common.white : theme.palette.text.primary;
  const sidebarTextSecondary = isLight ? alpha(theme.palette.common.white, 0.78) : theme.palette.text.secondary;

  const handleSubmenuToggle = (label: string) => {
    setOpenSubmenu(openSubmenu === label ? null : label);
  };

  return (
    <Box
      component="aside"
      sx={{
        width: 260,
        borderRight: sidebarBorder,
        bgcolor: sidebarBg,
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        p: 2,
        "& .MuiTypography-root": {
          fontWeight: 700,
        },
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="overline"
          sx={{
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: isLight ? theme.palette.common.white : "primary.main",
            fontWeight: 700,
          }}
        >
          RapiCredit
        </Typography>
        <Typography variant="body2" sx={{ color: sidebarTextSecondary }}>
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
                  color: sidebarTextSecondary,
                  textTransform: "uppercase",
                  letterSpacing: ".12em",
                  fontSize: 11,
                  px: 0,
                  fontWeight: 700,
                }}
              >
                {section.section}
              </ListSubheader>
            }
          >
            {section.items.map((item) => {
              const active = pathname.startsWith(item.href);
              const hasSubmenu = !!item.submenu?.length;
              const isOpen = openSubmenu === item.label;

              return (
                <React.Fragment key={item.href}>
                  <ListItemButton
                    component={hasSubmenu ? "div" : Link}
                    href={!hasSubmenu ? item.href : undefined}
                    onClick={hasSubmenu ? () => handleSubmenuToggle(item.label) : undefined}
                    selected={active}
                    sx={{
                      mb: 0.5,
                      color: sidebarText,
                      "&.Mui-selected": isLight
                        ? { bgcolor: alpha(theme.palette.common.white, 0.18) }
                        : { bgcolor: alpha(theme.palette.success.main, 0.16) },
                      "&:hover": isLight
                        ? { bgcolor: alpha(theme.palette.common.white, 0.14) }
                        : { bgcolor: alpha(theme.palette.success.main, 0.12) },
                    }}
                  >
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: 14,
                        color: active ? sidebarText : sidebarTextSecondary,
                        fontWeight: 700,
                      }}
                    />
                    {hasSubmenu && (isOpen ? <ExpandLess /> : <ExpandMore />)}
                  </ListItemButton>

                  {hasSubmenu && (
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding dense>
                        {item.submenu?.map((subItem) => {
                          const subActive = pathname === subItem.href;
                          return (
                            <ListItemButton
                              key={subItem.href}
                              component={Link}
                              href={subItem.href}
                              selected={subActive}
                              sx={{
                                pl: 4,
                                mb: 0.5,
                                color: sidebarText,
                                "&.Mui-selected": isLight
                                  ? { bgcolor: alpha(theme.palette.common.white, 0.18) }
                                  : { bgcolor: alpha(theme.palette.success.main, 0.16) },
                                "&:hover": isLight
                                  ? { bgcolor: alpha(theme.palette.common.white, 0.14) }
                                  : { bgcolor: alpha(theme.palette.success.main, 0.12) },
                              }}
                            >
                              <ListItemText
                                primary={subItem.label}
                                primaryTypographyProps={{
                                  fontSize: 13,
                                  color: subActive ? sidebarText : sidebarTextSecondary,
                                  fontWeight: 700,
                                }}
                              />
                            </ListItemButton>
                          );
                        })}
                      </List>
                    </Collapse>
                  )}
                </React.Fragment>
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
            bgcolor: isLight ? alpha(theme.palette.common.white, 0.22) : "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mr: 1.5,
            fontSize: 14,
            fontWeight: 600,
            color: isLight ? theme.palette.common.white : theme.palette.common.white,
          }}
        >
          A
        </Box>
        <Box>
          <Typography variant="body2" sx={{ color: sidebarText }}>Admin</Typography>
          <Typography variant="caption" sx={{ color: sidebarTextSecondary }}>
            Gerente
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
