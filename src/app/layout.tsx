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
  title: "KASUWA 2.0 — The Market That Listens",
  description:
    "A living night market powered by AI. Tell Mai Kasuwa what you need, and the market responds. No categories. No filters. Just conversation.",
  keywords: [
    "KASUWA",
    "Nigerian Marketplace",
    "AI Shopping",
    "Conversational Commerce",
    "Night Market",
    "Mai Kasuwa",
    "Haggle",
    "Nigeria",
    "Lagos",
    "Abuja",
  ],
  authors: [{ name: "KASUWA 2.0" }],
  openGraph: {
    title: "KASUWA 2.0 — The Market That Listens",
    description:
      "A living night market powered by AI. Tell the market what you need, and it responds.",
    type: "website",
    siteName: "KASUWA 2.0",
  },
  twitter: {
    card: "summary_large_image",
    title: "KASUWA 2.0 — The Market That Listens",
    description:
      "A living night market powered by AI. Tell the market what you need, and it responds.",
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
