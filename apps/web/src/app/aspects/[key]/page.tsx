import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/atoms/badge";
import { FOCUS_DIRECTORY_SLUG } from "@/lib/directory-focus";

export const dynamic = "force-static";

// PARKED (2026-07-03): the per-aspect cross-directory leaderboard is part of
// the generic "any-directory" ambition. While the product focuses on AI dev
// tool adoption decisions this route stays live for direct links but renders a
// paused notice. `topItemsByAspectKey` is untouched.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ key: string }>;
}): Promise<Metadata> {
  const { key } = await params;
  return {
    title: `${decodeURIComponent(key)} — EverythingRated`,
    description: "The aspect explorer is paused while the product focuses on AI dev tool adoption decisions.",
  };
}

export default async function AspectKeyPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key: raw } = await params;
  const key = decodeURIComponent(raw);
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-14">
      <Link
        href="/aspects"
        className="text-[12px] text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        ← Aspects
      </Link>
      <div className="mt-6">
        <Badge tone="outline">Paused</Badge>
        <h1 className="mt-4 text-[36px] font-semibold tracking-tight">
          The aspect explorer is paused
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-[1.6] text-[var(--muted)]">
          EverythingRated now does one job: multi-axis ratings for AI dev tool
          adoption decisions. The cross-directory leaderboard for the{" "}
          <span className="font-mono">{key}</span> axis is on hold. The six
          adoption axes for AI dev libraries live on the board.
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
