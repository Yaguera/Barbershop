import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
