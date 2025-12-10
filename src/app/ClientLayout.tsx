"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, Box } from "@mui/material";
import theme from "../theme/theme";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { usePathname } from "next/navigation";

type Props = {
  children: ReactNode;
};

export default function ClientLayout({ children }: Props) {
  const pathname = usePathname();

  // rutas que NO deben usar el layout
  const noLayoutRoutes = ["/login"];

  if (noLayoutRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        suppressHydrationWarning
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
    </ThemeProvider>
  );
}
