import Link from "next/link";

export const metadata = {
  title: "Terms — EverythingRated",
  description: "Use of EverythingRated is anonymous and provided as-is.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-sm leading-7">
      <Link href="/" className="text-[12px] text-[var(--muted)] hover:text-[var(--foreground)]">
        ← All directories
      </Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">Terms</h1>
      <p className="mt-4 text-xs text-[var(--muted)]">Last updated: 2026-05-15.</p>

      <h2 className="mt-8 text-base font-semibold">Anonymous use</h2>
      <p className="mt-2">
        EverythingRated has no accounts. Ratings are submitted under an
        opaque cookie. See <Link href="/privacy" className="underline">/privacy</Link>{" "}
        for what gets stored.
      </p>

      <h2 className="mt-8 text-base font-semibold">Be honest</h2>
      <p className="mt-2">
        Aggregate scores only matter if individual ratings are honest.
        Spam, vote stuffing, or coordinated manipulation may be removed
        at moderator discretion without notice.
      </p>

      <h2 className="mt-8 text-base font-semibold">No warranty</h2>
      <p className="mt-2">
        Provided as-is. Scores are opinions of pseudonymous raters and
        not a recommendation, endorsement, or warranty of any kind.
      </p>
    </main>
  );
}
