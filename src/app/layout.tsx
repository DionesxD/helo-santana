import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/app-providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Helo Santana — Nail Designer & Agendamentos",
  description: "Plataforma de agendamento para nail designer. Marque seu horário, experimente cores e acompanhe seus atendimentos.",
  keywords: ["manicure", "nail designer", "agendamento", "esmalte", "unhas", "esmaltação"],
  authors: [{ name: "Helo Santana" }],
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.png', sizes: '64x64', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    title: 'Helo Santana',
    statusBarStyle: 'default',
    capable: true,
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: "Helo Santana — Nail Designer & Agendamentos",
    description: "Marque seu horário, experimente cores e acompanhe seus atendimentos.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#211814",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
