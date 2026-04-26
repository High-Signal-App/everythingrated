import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/organisms/site-header";
import { SiteFooter } from "@/components/organisms/site-footer";

export const metadata: Metadata = {
  title: "EverythingRated — multi-axis ratings",
  description:
    "Every thing rated across multiple aspects, not a single star. POC: AI dev tools.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
