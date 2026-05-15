import Link from "next/link";

export const metadata = {
  title: "Privacy — EverythingRated",
  description: "EverythingRated has no accounts. The privacy story is short.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="text-[12px] text-[var(--muted)] hover:text-[var(--foreground)]">
        ← All directories
      </Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">Privacy</h1>
      <p className="mt-4 text-xs text-[var(--muted)]">Last updated: 2026-05-15.</p>

      <p className="mt-6 text-sm leading-7">
        EverythingRated has no user accounts. Ratings are submitted
        anonymously and identified only by an opaque cookie minted on
        your first rating.
      </p>

      <h2 className="mt-8 text-base font-semibold">The cookie</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        <li>
          Name: <code>er_visitor</code>. Value: random UUID, no personal
          info embedded.
        </li>
        <li>HttpOnly, SameSite=Lax, expires in one year.</li>
        <li>Minted lazily — only when you submit your first rating.</li>
        <li>
          Used so re-rating an aspect updates your previous score
          instead of creating a duplicate.
        </li>
      </ul>

      <h2 className="mt-8 text-base font-semibold">What we don&apos;t</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        <li>No login, no email collection, no IP-based tracking.</li>
        <li>No third-party analytics or remarketing tags.</li>
      </ul>

      <h2 className="mt-8 text-base font-semibold">Deletion</h2>
      <p className="mt-2 text-sm">
        Clear the <code>er_visitor</code> cookie in your browser to
        sever the link between your ratings and any future ones.
        Existing ratings remain in the aggregate but are no longer
        identifiable to you.
      </p>
    </main>
  );
}
