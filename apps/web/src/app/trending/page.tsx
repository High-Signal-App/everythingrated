import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/atoms/badge";
import { FOCUS_DIRECTORY_SLUG } from "@/lib/directory-focus";

export const metadata: Metadata = {
  title: "Trending — EverythingRated",
  description: "Trending is paused while the product focuses on AI dev tool adoption decisions.",
};

export const dynamic = "force-static";

// PARKED (2026-07-03): the cross-directory trending board mixed every
// category. While the product focuses on AI dev tool adoption decisions this
// route stays live for direct links but renders a paused notice.
export default function TrendingPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-14">
      <Link
        href="/"
        className="text-[12px] text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        ← Home
      </Link>
      <div className="mt-6">
        <Badge tone="outline">Paused</Badge>
        <h1 className="mt-4 text-[36px] font-semibold tracking-tight">
          Trending is paused
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-[1.6] text-[var(--muted)]">
          EverythingRated now does one job: multi-axis ratings for AI dev tool
          adoption decisions. The cross-directory trending board is on hold
          while that use case is proven. See the most-rated AI dev libraries on
          the board instead.
        </p>
        <div className="mt-8">
          <Link
            href={`/d/${FOCUS_DIRECTORY_SLUG}`}
            className="inline-flex h-11 items-center rounded-[var(--radius-sm)] bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-90"
          >
            Browse AI dev libraries →
          </Link>
        </div>
      </div>
    </div>
  );
}
