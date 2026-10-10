import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import localFont from "next/font/local";
import "./globals.css";

const poppins = localFont({
  src: [
    { path: "./fonts/poppins-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/poppins-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/poppins-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/poppins-700.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-poppins",
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
    <html lang="pt-BR" className={`${poppins.variable} h-full antialiased`}>
      <SessionProvider>
        <body className="min-h-full flex flex-col bg-[#0D0D0D] text-[#FFFFFF] font-sans">
          {children}
        </body>
      </SessionProvider>
    </html>
  );
}
