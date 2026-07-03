import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/atoms/badge";
import { FOCUS_DIRECTORY_SLUG } from "@/lib/directory-focus";

export const metadata: Metadata = {
  title: "Aspects — EverythingRated",
  description: "The aspect explorer is paused while the product focuses on AI dev tool adoption decisions.",
};

export const dynamic = "force-static";

// PARKED (2026-07-03): the cross-directory aspect explorer mixed axes from
// every category. While the product focuses on AI dev tool adoption decisions
// this route stays live for direct links but renders a paused notice. The
// `listAspectKeys` query and `/aspects/[key]` route are untouched.
export default function AspectsIndex() {
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
          The aspect explorer is paused
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-[1.6] text-[var(--muted)]">
          EverythingRated now does one job: multi-axis ratings for AI dev tool
          adoption decisions. The cross-directory aspect explorer — which
          compared axes like &ldquo;latency&rdquo; and &ldquo;cost&rdquo; across
          unrelated categories — is on hold. The six adoption axes for AI dev
          libraries live on the board.
        </p>
        <div className="mt-8">
          <Link
            href={`/d/${FOCUS_DIRECTORY_SLUG}`}
            className="inline-flex h-11 items-center rounded-[var(--radius-sm)] bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-90"
          >
            See the adoption axes →
          </Link>
        </div>
      </div>
    </div>
  );
}
