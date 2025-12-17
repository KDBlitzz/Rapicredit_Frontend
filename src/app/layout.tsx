import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "./ClientLayout";
import ThemeRegistry from "./ThemeRegistry";

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
          <ClientLayout>{children}</ClientLayout>
        </ThemeRegistry>
      </body>
    </html>
  );
}
