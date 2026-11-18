import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prospecção Curitiba",
  description: "Sistema de prospecção de clientes via Google Maps com Supabase e WhatsApp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
