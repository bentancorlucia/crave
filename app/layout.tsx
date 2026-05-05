import type { Metadata, Viewport } from "next";
import { Caveat, Fraunces, Outfit } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "crave. — hub interno",
  description: "Hub financiero de crave.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "crave.",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#faf2bc",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${outfit.variable} ${caveat.variable}`}
    >
      <body className="font-sans min-h-[100dvh]">{children}</body>
    </html>
  );
}
