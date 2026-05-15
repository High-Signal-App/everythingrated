import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — EverythingRated",
  description:
    "EverythingRated reviews everything along the axes that actually matter for that category. AI tools get rated on different aspects than databases.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="text-[12px] text-[var(--muted)] hover:text-[var(--foreground)]">
        ← All directories
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">About</h1>
      <p className="mt-3 text-sm text-[var(--muted)]">
        Every &ldquo;thing&rdquo; gets rated on the axes that actually
        matter for its category. An AI editor is graded differently
        than a database — and a five-star average loses that.
      </p>

      <section className="mt-8 space-y-3 text-sm leading-6">
        <h2 className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
          How it works
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Items live inside <strong>directories</strong>. Each
            directory has its own <strong>aspects</strong> — the
            dimensions everything in that bucket is rated on.
          </li>
          <li>
            Ratings are anonymous (no account needed). A cookie ties
            your ratings together so you can update them later.
          </li>
          <li>
            Aggregates are computed on the fly: average per aspect, plus
            an overall average across aspects.
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-6">
        <h2 className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
          For developers
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Each directory exposes <code>/d/[slug]/items.json</code> —
            a portable JSON snapshot of items + aggregates.
          </li>
          <li>
            Each directory exposes <code>/d/[slug]/rss</code> — an RSS
            feed of items in that bucket.
          </li>
          <li>
            <Link href="/d/ai-dev-tools/random" className="underline">
              /d/[slug]/random
            </Link>{" "}
            bounces to a random item in the directory.
          </li>
        </ul>
      </section>
    </main>
  );
}
