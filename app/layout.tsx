import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AgenticBackground from "@/components/AgenticBackground";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"),
  title: {
    default: "Usama Gillani — AI Engineer",
    template: "%s | Usama Gillani",
  },
  description:
    "Syed Muhammad Usama Altaf Gillani — AI engineering, LLM applications, intelligent systems, and backend development.",
  applicationName: "Usama Gillani Portfolio",
  openGraph: {
    title: "Usama Gillani — AI Engineer",
    description: "Building intelligence, not just interfaces.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070908",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="bg-void font-sans text-ink antialiased">
        <AgenticBackground />
        {children}
      </body>
    </html>
  );
}
