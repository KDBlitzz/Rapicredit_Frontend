import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "./ClientLayout";
import ThemeRegistry from "./ThemeRegistry";
import { AuthProvider } from "../context/AuthContext";

export const metadata: Metadata = {
  title: "RapiCredit · Panel de administración",
  description: "Portal interno para administración de préstamos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <ThemeRegistry>
          <AuthProvider>
            <ClientLayout>{children}</ClientLayout>
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
