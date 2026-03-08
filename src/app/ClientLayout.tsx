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
  const { empleado, loading } = useEmpleadoActual();

  const rolActual = (empleado?.rol || "").toLowerCase();
  const isCaja = rolActual === "caja";
  const cajaPathPermitido = pathname.startsWith("/cuadres");

  useEffect(() => {
    if (loading) return;
    if (isCaja && !cajaPathPermitido) {
      router.replace("/cuadres");
    }
  }, [cajaPathPermitido, isCaja, loading, router]);

  if (!loading && isCaja && !cajaPathPermitido) {
    return null;
  }

  const noLayoutRoutes = ["/login"];
  const isComprobanteAbono = /^\/pagos(?:\/[^/]+)?\/comprobante\/?$/.test(pathname);
  if (noLayoutRoutes.includes(pathname) || isComprobanteAbono) return <>{children}</>;

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
