import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Corte & Estilo | Barbearia Premium & Agendamento",
  description: "Agende seu horário online na Barbearia Corte & Estilo. Atendimento personalizado, barbeiros experientes e ambiente premium.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <SessionProvider>
        <body className="min-h-full flex flex-col bg-preto-profundo text-branco font-sans">
          {children}
        </body>
      </SessionProvider>
    </html>
  );
}
