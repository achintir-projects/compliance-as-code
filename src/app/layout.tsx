import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Glassbox AI - The Compliance-First Fintech Agent Platform",
  description: "Advanced compliance and regulatory platform for financial institutions. Glassbox AI provides enterprise-grade AI orchestration with zero-knowledge proofs, self-healing compliance, and federated risk exchange.",
  keywords: ["Glassbox AI", "Compliance", "Fintech", "Regulatory", "AI", "Zero Knowledge", "Financial Services", "Risk Management", "Automation"],
  authors: [{ name: "Glassbox AI Team" }],
  openGraph: {
    title: "Glassbox AI - Compliance-First Fintech Agent Platform",
    description: "Advanced compliance and regulatory platform for financial institutions with enterprise-grade AI orchestration",
    url: "https://glassbox.ai",
    siteName: "Glassbox AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Glassbox AI - Compliance-First Fintech Agent Platform",
    description: "Advanced compliance and regulatory platform for financial institutions",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
