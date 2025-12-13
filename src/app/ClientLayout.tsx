"use client";

import { ReactNode } from "react";
import { Box } from "@mui/material";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { usePathname } from "next/navigation";

type Props = {
  children: ReactNode;
};

export default function ClientLayout({ children }: Props) {
  const pathname = usePathname();

  const noLayoutRoutes = ["/login"];
  if (noLayoutRoutes.includes(pathname)) return <>{children}</>;

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
