import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import Navigation from "@/components/layout/Navigation";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import KeyboardShortcutsHelp from "@/components/ui/KeyboardShortcutsHelp";
import { ToastProvider } from "@/components/ui/Toast";
import PWAInstallPrompt, { OfflineIndicator } from "@/components/common/PWAInstallPrompt";
import PWAInitializer from "@/components/common/PWAInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blockcert Afrika - Kenya's Premier Data & Analytics Platform",
  description: "Transforming complex data into actionable insights across political, economic, and social sectors. Advanced analytics, forecasting, and visualization for Kenya.",
  keywords: ["Kenya data analytics", "political forecasting", "budget analysis", "health analytics", "2027 elections", "IEBC data", "Bayesian AI", "data visualization", "Kenya insights"],
  authors: [{ name: "Blockcert Afrika" }],
  openGraph: {
    title: "Blockcert Afrika - Data & Analytics Platform",
    description: "Kenya's premier data and analytics platform delivering precision insights across multiple sectors",
    type: "website",
    locale: "en_KE",
    siteName: "Blockcert Afrika",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blockcert Afrika - Data & Analytics",
    description: "Transforming complex data into actionable insights for Kenya",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1a1a1a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Blockcert Afrika" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased pb-16 md:pb-0`}
      >
        <PWAInitializer />
        <ToastProvider>
          <OfflineIndicator />
          <Navigation />
          {children}
          <MobileBottomNav />
          <KeyboardShortcutsHelp />
          <PWAInstallPrompt />
        </ToastProvider>
      </body>
    </html>
  );
}
