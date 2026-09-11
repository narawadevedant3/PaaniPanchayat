import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "../src/context/LanguageContext";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
<<<<<<< HEAD
  themeColor: "#1F6F6A",
=======
  themeColor: "#0d9488",
>>>>>>> origin/pranav
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "PaaniPanchayat — Fair Water. Peaceful Farming.",
  description: "AI-Powered Water Sharing & Dispute Mediation Platform for Farmers",
  manifest: "/manifest.json",
<<<<<<< HEAD
=======
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" }
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
>>>>>>> origin/pranav
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[var(--color-bg)] text-[var(--color-text-primary)] antialiased min-h-screen`}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}

