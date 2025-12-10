import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "./ClientLayout";

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
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
