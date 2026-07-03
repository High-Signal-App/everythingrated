import Link from "next/link";

import { Badge } from "@/components/atoms/badge";
import { FOCUS_DIRECTORY_SLUG } from "@/lib/directory-focus";

export const dynamic = "force-static";

// PARKED (2026-07-03): public directory creation is paused while the product
// focuses on AI dev tool decisions. The route stays live for direct links,
// but the submission form (`DirectorySubmissionForm`, removed — see git
// history) and its `submitDirectory` server action are gone. Moderation of
// the existing `directory_submissions` queue still works on /moderation.
export default function SubmitDirectoryPage() {
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
          Directory submissions are paused
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-[1.6] text-[var(--muted)]">
          EverythingRated now does one job: multi-axis ratings for AI dev tool
          decisions. New directories are on hold while that use case is proven.
          Existing directories keep their pages and ratings.
        </p>
        <div className="mt-8">
          <Link
            href={`/d/${FOCUS_DIRECTORY_SLUG}/submit`}
            className="inline-flex h-11 items-center rounded-[var(--radius-sm)] bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-90"
          >
            Suggest an AI dev tool instead
          </Link>
        </div>
      </div>
    </div>
  );
}
