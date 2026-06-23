import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  metadataBase: new URL("https://noxiss.vercel.app"),
  title: "Noxis — Encrypted second brain on 0G",
  description:
    "Your mind, end-to-end encrypted. Notes are encrypted in your browser and stored on 0G — readable only by you.",
  applicationName: "Noxis",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Noxis — your mind, end-to-end encrypted",
    description:
      "A sovereign second brain. Notes encrypted in your browser, stored on 0G — readable only by you.",
    url: "https://noxiss.vercel.app",
    siteName: "Noxis",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Noxis — your mind, end-to-end encrypted" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Noxis — your mind, end-to-end encrypted",
    description:
      "A sovereign second brain. Notes encrypted in your browser, stored on 0G — readable only by you.",
    images: ["/og.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Noxis",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-48.png", type: "image/png", sizes: "48x48" },
    ],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
