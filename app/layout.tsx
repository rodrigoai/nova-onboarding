import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Empresas · nova.money",
  description: "Cadastro fiscal de empresas da nova.money",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
