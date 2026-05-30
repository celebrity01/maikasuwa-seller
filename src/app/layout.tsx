import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#06080C",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "KASUWA Seller Portal — Manage Your Shop",
  description:
    "Seller portal for KASUWA 2.0 marketplace. Upload products, manage your shop, and connect with buyers across Nigeria.",
  keywords: [
    "KASUWA",
    "Seller Portal",
    "Nigerian Marketplace",
    "Product Upload",
    "Shop Management",
    "Night Market",
    "Nigeria",
  ],
  authors: [{ name: "KASUWA 2.0" }],
  openGraph: {
    title: "KASUWA Seller Portal",
    description:
      "Manage your shop on KASUWA 2.0 — the night market that listens. Upload products, track views, and grow your business.",
    type: "website",
    siteName: "KASUWA 2.0 Seller Portal",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "rgba(20, 26, 34, 0.95)",
              border: "1px solid rgba(255, 154, 60, 0.2)",
              color: "#FFE4A0",
              backdropFilter: "blur(20px)",
              borderRadius: "12px",
              fontSize: "14px",
              padding: "12px 16px",
            },
          }}
        />
      </body>
    </html>
  );
}
