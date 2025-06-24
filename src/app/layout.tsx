import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import { Providers } from "@/components/providers";

// Use Inter as a fallback font
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

// Use the same font for mono
const interMono = Inter({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});


export const metadata: Metadata = {
  title: "BluePay Wallet",
  description: "Secure, modern web wallet for Ethereum and BNB Chain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body
        className={`${inter.variable} ${interMono.variable} antialiased bg-[#222222] text-white`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
