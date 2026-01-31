"use client";

import React, { useState } from "react";
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

  const handleSubmenuToggle = (label: string) => {
    setOpenSubmenu(openSubmenu === label ? null : label);
  };

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
                                primary={subItem.label}
                                primaryTypographyProps={{
                                  fontSize: 13,
                                  color: subActive ? "text.primary" : "text.secondary",
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
