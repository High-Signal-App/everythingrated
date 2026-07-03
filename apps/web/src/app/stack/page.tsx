import Link from "next/link";

import { Badge } from "@/components/atoms/badge";
import { FOCUS_DIRECTORY_SLUG } from "@/lib/directory-focus";

export const dynamic = "force-static";

// PARKED (2026-07-03): the cross-directory stack builder was part of the
// generic "any-directory" ambition. While the product focuses on AI dev tool
// adoption decisions, this route stays live for direct links but renders a
// paused notice. The StackBuilder organism, `lib/stack*`, and
// `lib/query-intent` are untouched — see git history to restore.
export default function StackPage() {
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
          The stack builder is paused
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-[1.6] text-[var(--muted)]">
          EverythingRated now does one job: multi-axis ratings for AI dev tool
          adoption decisions. The cross-directory stack builder — which mixed
          databases, hosting, and other categories — is on hold while that use
          case is proven. Existing directories keep their pages and ratings.
        </p>
        <div className="mt-8">
          <Link
            href={`/d/${FOCUS_DIRECTORY_SLUG}`}
            className="inline-flex h-11 items-center rounded-[var(--radius-sm)] bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-90"
          >
            Compare AI dev libraries →
          </Link>
        </div>
      </div>
    </div>
  );
}
