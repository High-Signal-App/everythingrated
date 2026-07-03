import "./globals.css";

import type { Metadata } from "next";

import { SiteFooter } from "@/components/organisms/site-footer";
import { SiteHeader } from "@/components/organisms/site-header";
import { AnalyticsProvider } from "@/components/posthog-provider";
import { SaaSMakerFeedback } from "@/components/saasmaker-feedback";
import { VitalsReporter } from "@/components/VitalsReporter";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  title: {
    default: "EverythingRated — multi-axis ratings for AI dev tool decisions",
    template: "%s — EverythingRated",
  },
  description:
    "Decide which AI dev libraries to adopt. Every library scored on 6 adoption axes — maintenance, community, license, API stability, footprint, AI portability — instead of one star.",
  applicationName: "EverythingRated",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "EverythingRated",
    title: "EverythingRated — multi-axis ratings for AI dev tool decisions",
    description:
      "Every AI dev library scored on 6 adoption axes — maintenance, community, license, API stability, footprint, AI portability — instead of one star.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "EverythingRated — multi-axis ratings for AI dev tool decisions",
    description:
      "Every AI dev library scored on 6 adoption axes — maintenance, community, license, API stability, footprint, AI portability — instead of one star.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <AnalyticsProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <SaaSMakerFeedback />
          <VitalsReporter />
        </AnalyticsProvider>
        {/*
          Cloudflare Web Analytics — only injected when a real beacon token is
          configured via NEXT_PUBLIC_CF_BEACON_TOKEN. A placeholder token loads
          a broken beacon, so we omit the script entirely until one is set.
        */}
        {process.env.NEXT_PUBLIC_CF_BEACON_TOKEN ? (
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({
              token: process.env.NEXT_PUBLIC_CF_BEACON_TOKEN,
            })}
          />
        ) : null}
      </body>
    </html>
  );
}
