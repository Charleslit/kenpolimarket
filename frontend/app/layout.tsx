import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/layout/Navigation";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import KeyboardShortcutsHelp from "@/components/ui/KeyboardShortcutsHelp";
import { ToastProvider } from "@/components/ui/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KenPoliMarket - Kenya Political Forecasting Platform",
  description: "Data-driven political forecasting for Kenya's 2027 elections. Probabilistic predictions for all 47 counties using Bayesian AI and official IEBC data.",
  keywords: ["Kenya elections", "political forecasting", "2027 elections", "IEBC data", "county predictions", "Bayesian AI", "election analysis", "Kenya politics"],
  authors: [{ name: "KenPoliMarket Team" }],
  openGraph: {
    title: "KenPoliMarket - Kenya Political Forecasting",
    description: "Data-driven forecasting for Kenya's 2027 elections with county-level predictions",
    type: "website",
    locale: "en_KE",
    siteName: "KenPoliMarket",
  },
  twitter: {
    card: "summary_large_image",
    title: "KenPoliMarket - Kenya Political Forecasting",
    description: "Data-driven forecasting for Kenya's 2027 elections",
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#2563eb",
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
        <meta name="apple-mobile-web-app-title" content="KenPoliMarket" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased pb-16 md:pb-0`}
      >
        <ToastProvider>
          <Navigation />
          {children}
          <MobileBottomNav />
          <KeyboardShortcutsHelp />
        </ToastProvider>
      </body>
    </html>
  );
}
