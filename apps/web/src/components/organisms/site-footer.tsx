import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--border)]">
      <div className="mx-auto w-full max-w-6xl px-6 py-6 text-[11px] text-[var(--muted-2)]">
        <p className="text-[var(--muted)]">
          One star can&rsquo;t pick your next AI dev tool. Five axes can.
        </p>
        <p className="mt-1">
          © {new Date().getFullYear()} EverythingRated · Multi-axis ratings for AI dev tool
          decisions · Anonymous, cookie-bound ratings · POC by{' '}
          <a
            href="https://sarthakagrawal.pages.dev"
            className="underline-offset-4 hover:text-[var(--foreground)] hover:underline"
          >
            Sarthak
          </a>
          .
        </p>
        <p className="mt-1">
          <Link
            href="/feeds"
            className="underline-offset-4 hover:text-[var(--foreground)] hover:underline"
          >
            JSON & RSS feeds
          </Link>{' '}
          ·{' '}
          <Link
            href="/api-docs"
            className="underline-offset-4 hover:text-[var(--foreground)] hover:underline"
          >
            API docs
          </Link>
        </p>
      </div>
    </footer>
  );
}
