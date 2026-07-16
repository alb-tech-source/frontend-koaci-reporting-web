import type { Metadata } from "next";
// Anda bisa mengganti font 'Inter' dengan font lain dari google fonts jika mau
import { Inter } from "next/font/google"; 
import "./globals.css";

// Jika Anda sudah memiliki file providers.tsx (misal untuk React Query), uncomment baris di bawah:
// import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Koaci Reporting App",
  description: "Sistem pelaporan investasi syariah PT Koaci Sinergi Indonesia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Jika Anda punya Providers, bungkus children seperti ini: */}
        {/* <Providers>{children}</Providers> */}
        
        {/* Jika tidak, cukup render children langsung: */}
        {children}
      </body>
    </html>
  );
}