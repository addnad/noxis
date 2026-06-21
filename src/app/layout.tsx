import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Noxis — Encrypted intelligence on 0G",
  description:
    "Noxis is your sovereign second brain. Notes are encrypted in your browser, stored on 0G Storage, and queried with verifiable 0G Compute. Your keys, your mind.",
  applicationName: "Noxis",
  keywords: [
    "0G",
    "decentralized AI",
    "encrypted notes",
    "second brain",
    "verifiable compute",
    "0G Storage",
    "0G Compute",
  ],
  authors: [{ name: "Noxis" }],
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Noxis — Encrypted intelligence on 0G",
    description:
      "Your sovereign second brain. Encrypted client-side, stored on 0G, queried with verifiable AI.",
    siteName: "Noxis",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#06070a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${grotesk.variable} ${mono.variable}`}>
      <body>
        <div className="noxis-bg" />
        <div className="noxis-grid" />
        <div className="noxis-grain" />
        {children}
      </body>
    </html>
  );
}
