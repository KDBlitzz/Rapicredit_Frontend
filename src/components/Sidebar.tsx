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
import { useEmpleadoActual } from "../hooks/useEmpleadoActual";

type NavSubItem = {
  label: string;
  href: string;
  requiredPermisos?: string[];
  hiddenForRoles?: string[]; // roles (en minúsculas) para los que este item no debe mostrarse
};
type NavItem = NavSubItem & { submenu?: NavSubItem[] };
type NavSection = { section: string; items: NavItem[] };

const navItems: NavSection[] = [
  {
    section: "General",
    items: [
      { label: "Dashboard", href: "/dashboard" },      
      // Créditos / préstamos y pagos
      { label: "Préstamos", href: "/prestamos", requiredPermisos: ["f001", "F002"] },
      { label: "Pagos", href: "/pagos", requiredPermisos: ["F005"] },   
      // Solicitudes de crédito (aprobación / gestión)
      { label: "Solicitudes", href: "/solicitudes", requiredPermisos: ["F010"] },
      // Tasas y configuración de crédito
      { label: "Tasas", href: "/tasas", requiredPermisos: ["F014"] },
      // Clientes
      { label: "Clientes", href: "/clientes", requiredPermisos: ["C001", "C003"] },         
    ],
  },
  {
    section: "Personal",
    items: [
      // Gestión de empleados: requiere permisos de seguridad
      {
        label: "Empleados",
        href: "/empleados",
        requiredPermisos: ["S003", "S001"],
        hiddenForRoles: ["asesor"], // Los asesores no deben ver Empleados
      },
      // Carteras por usuario
      { label: "Gestión de Carteras", href: "/carteras", requiredPermisos: ["S001"] },
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
      { label: "Estadísticas Asesor", href: "/empleados/estadisticas", requiredPermisos: ["F008", "F009"] }
    ],
  },
  {
    section: "Sistema",
    items: [{ label: "Configuración", href: "/configuracion", requiredPermisos: ["S001", "S002", "S003"] }],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const { empleado } = useEmpleadoActual();

  const permisosActuales = (empleado?.permisos || []).map((p) => p.toUpperCase());
  const rolActual = (empleado?.rol || "").toLowerCase();

  const hasPermisos = (required?: string[]) => {
    if (!required || required.length === 0) return true;
    if (!permisosActuales.length) return false;
    return required.some((code) => permisosActuales.includes(code.toUpperCase()));
  };

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
        {navItems.map((section) => {
          // Para rol Asesor ocultamos toda la sección "Personal"
          if (rolActual === "asesor" && section.section === "Personal") {
            return null;
          }

          return (
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
              if (item.hiddenForRoles && item.hiddenForRoles.includes(rolActual)) {
                return null;
              }
              if (!hasPermisos(item.requiredPermisos)) return null;
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
                          if (
                            subItem.hiddenForRoles &&
                            subItem.hiddenForRoles.includes(rolActual)
                          ) {
                            return null;
                          }
                          if (!hasPermisos(subItem.requiredPermisos)) return null;
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
          );
        })}
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
          {(empleado?.nombreCompleto || empleado?.usuario || "A")
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase())
            .join("") || "A"}
        </Box>
        <Box>
          <Typography variant="body2">
            {empleado?.nombreCompleto || empleado?.usuario || "Usuario"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {empleado?.rol || "Sin rol"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
