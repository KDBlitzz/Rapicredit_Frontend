"use client";

import { ReactNode, useEffect } from "react";
import { Box } from "@mui/material";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { usePathname, useRouter } from "next/navigation";
import { useEmpleadoActual } from "../hooks/useEmpleadoActual";

type Props = {
  children: ReactNode;
};

export default function ClientLayout({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { empleado, loading, firebaseUser } = useEmpleadoActual();

  const noLayoutRoutes = ["/login"];
  const isComprobanteAbono = /^\/pagos(?:\/[^/]+)?\/comprobante\/?$/.test(pathname);
  const isPublicRoute = noLayoutRoutes.includes(pathname) || isComprobanteAbono;

  useEffect(() => {
    if (isPublicRoute) return;
    if (loading) return;
    if (!firebaseUser) {
      router.replace("/login");
    }
  }, [firebaseUser, isPublicRoute, loading, router]);

  const rolActual = (empleado?.rol || "").toLowerCase();
  const isCaja = rolActual === "caja";
  const cajaPathPermitido = pathname.startsWith("/cuadres");

  const isContadora = rolActual === "contadora" || rolActual === "contador" || rolActual === "contabilidad";
  const contabilidadPathPermitido = pathname.startsWith("/contabilidad");

  useEffect(() => {
    if (isPublicRoute) return;
    if (loading) return;
    if (isCaja && !cajaPathPermitido) {
      router.replace("/cuadres");
      return;
    }
    if (isContadora && !contabilidadPathPermitido) {
      router.replace("/contabilidad");
    }
  }, [cajaPathPermitido, contabilidadPathPermitido, isCaja, isContadora, isPublicRoute, loading, router]);

  if (isPublicRoute) return <>{children}</>;

  // Mientras redirigimos a /login
  if (!loading && !firebaseUser) return null;

  if (!loading && isCaja && !cajaPathPermitido) {
    return null;
  }

  if (!loading && isContadora && !contabilidadPathPermitido) {
    return null;
  }

  if (loading) return null;

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Sidebar />
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Topbar />
        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: "auto",
            p: 2,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
