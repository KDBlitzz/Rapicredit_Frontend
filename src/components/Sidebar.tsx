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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { useEmpleadoActual } from "../hooks/useEmpleadoActual";
import { useAuth } from "../context/AuthContext";

type NavSubItem = {
  label: string;
  href?: string;
  action?: "logout";
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
      { label: "Pagos", href: "/pagos", requiredPermisos: ["F005", "PERM-CAJA-001", "PERM-CAJA-002"] },
      {
        label: "Cuadres",
        href: "/cuadres",
        requiredPermisos: ["F005", "F009", "PERM-CAJA-004"],
        hiddenForRoles: ["asesor", "caja"],
      },
      // Solicitudes de crédito (aprobación / gestión)
      // Ver módulo: F001/F002. Flujo de aprobación: F010.
      { label: "Solicitudes", href: "/solicitudes", requiredPermisos: ["F001", "F002", "F010"] },
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
        hiddenForRoles: ["asesor", "caja"], // Los asesores y cajeros no deben ver Empleados
      },
      // Carteras por usuario
      { label: "Gestión de Carteras", href: "/carteras", requiredPermisos: ["S001"], hiddenForRoles: ["caja"] },
    ],
  },
  {
    section: "Análisis",
    items: [
      {
        label: "Contabilidad",
        href: "/contabilidad",
        // Visible para perfiles con permisos de control/gestión; Contadora lo ve por menú dedicado.
        requiredPermisos: ["S001", "S002", "F009"],
        hiddenForRoles: ["asesor", "caja"],
      },
      {
        label: "Trazabilidad de decisiones",
        href: "/reportes/trazabilidad-decisiones",
        hiddenForRoles: ["asesor", "caja"],
      },
      {
        label: "Reportes",
        href: "/reportes",
        submenu: [
          { label: "Central de Riesgos", href: "/reportes/central-riesgos" },
          { label: "Seguro de Vida", href: "/reportes/seguro-vida" },
          { label: "Pago al SAR", href: "/reportes/pago-sar" },
        ],
        hiddenForRoles: ["caja"],
      },
      {
        label: "Estadísticas Asesor",
        href: "/empleados/estadisticas",
        requiredPermisos: ["F008", "F009"],
        hiddenForRoles: ["caja"],
      },
    ],
  },
  {
    section: "Sistema",
    // Configuración solo para seguridad avanzada (S001/S002). Asesor (S003) y Caja no la ven.
    items: [
      { label: "Configuración", href: "/configuracion", requiredPermisos: ["S001", "S002"], hiddenForRoles: ["caja"] },
      { label: "Cerrar sesión", action: "logout" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const { empleado } = useEmpleadoActual();
  const { logout } = useAuth();

  const permisosActuales = (empleado?.permisos || []).map((p) => p.toUpperCase());
  const rolActual = (empleado?.rol || "").toLowerCase();
  const isCaja = rolActual === "caja";
  const isContadora = rolActual === "contadora" || rolActual === "contador" || rolActual === "contabilidad";

  const hasPermisos = (required?: string[]) => {
    if (!required || required.length === 0) return true;
    if (!permisosActuales.length) return false;
    return required.some((code) => permisosActuales.includes(code.toUpperCase()));
  };

  const sectionsToRender: NavSection[] = (() => {
    if (isContadora) {
      return [
        {
          section: "Contabilidad",
          items: [{ label: "Contabilidad", href: "/contabilidad" }],
        },
        {
          section: "Sistema",
          items: [{ label: "Cerrar sesión", action: "logout" }],
        },
      ];
    }

    return navItems
      .map((section) => {
        if (isCaja) {
          if (section.section === "General") {
            return {
              ...section,
              items: section.items.filter((item) => item.href === "/cuadres"),
            };
          }
          if (section.section === "Sistema") {
            return {
              ...section,
              items: section.items.filter((item) => item.action === "logout"),
            };
          }
          return { ...section, items: [] };
        }

        if (rolActual === "asesor" && section.section === "Personal") {
          return { ...section, items: [] };
        }

        return section;
      })
      .filter((section) => section.items.length > 0);
  })();

  const handleSubmenuToggle = (label: string) => {
    setOpenSubmenu(openSubmenu === label ? null : label);
  };

  const handleAction = async (action: NavSubItem["action"]) => {
    if (action === "logout") {
      setLogoutDialogOpen(true);
    }
  };

  const handleConfirmLogout = async () => {
    setLogoutDialogOpen(false);
    try {
      await logout();
    } finally {
      router.replace("/login");
    }
  };

  return (
    <>
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
        {sectionsToRender.map((section) => {
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
                if (!isCaja && !hasPermisos(item.requiredPermisos)) return null;

                const active = item.href ? pathname.startsWith(item.href) : false;
                const hasSubmenu = !!item.submenu?.length;
                const isOpen = openSubmenu === item.label;
                const isAction = !!item.action;

                return (
                  <React.Fragment key={item.href ?? item.action ?? item.label}>
                    <ListItemButton
                      component={hasSubmenu || isAction ? "div" : Link}
                      href={!hasSubmenu && !isAction ? item.href : undefined}
                      onClick={
                        hasSubmenu
                          ? () => handleSubmenuToggle(item.label)
                          : isAction
                          ? () => void handleAction(item.action)
                          : undefined
                      }
                      selected={!isAction && active}
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
                          color: !isAction && active ? "text.primary" : "text.secondary",
                        }}
                      />
                      {hasSubmenu && (isOpen ? <ExpandLess /> : <ExpandMore />)}
                    </ListItemButton>

                    {hasSubmenu && (
                      <Collapse in={isOpen} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding dense>
                          {item.submenu?.map((subItem) => {
                            if (subItem.hiddenForRoles && subItem.hiddenForRoles.includes(rolActual)) {
                              return null;
                            }
                            if (!isCaja && !hasPermisos(subItem.requiredPermisos)) return null;

                            const subActive = pathname === subItem.href;
                            return (
                              <ListItemButton
                                key={subItem.href}
                                component={Link}
                                href={subItem.href!}
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

      <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)}>
        <DialogTitle>Cerrar sesión</DialogTitle>
        <DialogContent>
          <DialogContentText>¿Desea Cerrar la sesión?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => void handleConfirmLogout()}>
            Cerrar sesión
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
