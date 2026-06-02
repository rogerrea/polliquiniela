import type { Metadata } from "next";
import { FloatingPrizeBanner } from "@/components/FloatingPrizeBanner";
import { Nav } from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "PolliQuiniela Mundialista - Grupalia",
  description: "La quiniela mundialista de Grupalia."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <FloatingPrizeBanner />
      </body>
    </html>
  );
}
