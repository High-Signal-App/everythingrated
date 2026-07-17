import type { Metadata } from 'next';
import Link from 'next/link';

import { listDirectories } from '@/lib/ratings';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Feeds — EverythingRated',
  description: 'All public JSON and RSS feeds for EverythingRated directories and items.',
};

type FeedKind = 'JSON' | 'RSS 2.0' | 'XML' | 'text';

type Feed = {
  path: string;
  kind: FeedKind;
  description: string;
};

export default async function FeedsPage() {
  let directories: Awaited<ReturnType<typeof listDirectories>> = [];
  try {
    directories = await listDirectories();
  } catch {
    /* DB offline — show only the global feeds. */
  }

  const globalFeeds: Feed[] = [
    {
      path: '/directories.json',
      kind: 'JSON',
      description: 'Every directory with its slug, name, item count, and aspect count.',
    },
    {
      path: '/sitemap.xml',
      kind: 'XML',
      description: 'All public directory and item pages for crawlers.',
    },
    {
      path: '/robots.txt',
      kind: 'text',
      description: 'Crawler rules and the sitemap location.',
    },
  ];

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <Link href="/" className="text-[12px] text-[var(--muted)] hover:text-[var(--foreground)]">
        ← All directories
      </Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Feeds</h1>
      <p className="mt-3 text-sm text-[var(--muted)]">
        Public, read-only data exports. Subscribe to an RSS feed for new items in a directory, or
        pull the JSON endpoints to build your own dashboards and analyses. All feeds reflect real
        rating aggregates from the EverythingRated database.
      </p>

      <section className="mt-10">
        <h2 className="text-[12px] uppercase tracking-[0.1em] text-[var(--muted)]">Global</h2>
        <FeedTable feeds={globalFeeds} />
      </section>

      <section className="mt-10">
        <h2 className="text-[12px] uppercase tracking-[0.1em] text-[var(--muted)]">
          Per-directory
        </h2>
        <p className="mt-1 text-[12px] text-[var(--muted-2)]">
          Each directory exposes its items as JSON and RSS. Substitute the directory slug (e.g.{' '}
          <code>ai-dev-tools</code>).
        </p>
        {directories.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">No directories available right now.</p>
        ) : (
          <div className="mt-4 space-y-6">
            {directories.map(({ directory, itemCount, aspectCount }) => (
              <div
                key={directory.id}
                className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-5 py-4"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[15px] font-semibold">
                    <Link href={`/d/${directory.slug}`} className="hover:underline">
                      {directory.name}
                    </Link>
                  </h3>
                  <span className="text-[11px] text-[var(--muted-2)]">
                    {itemCount} item{itemCount === 1 ? '' : 's'} · {aspectCount} aspect
                    {aspectCount === 1 ? '' : 's'}
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-[var(--muted)]">{directory.description}</p>
                <FeedTable
                  feeds={[
                    {
                      path: `/d/${directory.slug}/items.json`,
                      kind: 'JSON',
                      description: 'All items with per-aspect aggregate scores and rater counts.',
                    },
                    {
                      path: `/d/${directory.slug}/rss`,
                      kind: 'RSS 2.0',
                      description: 'Items in this directory as an RSS feed.',
                    },
                  ]}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-[12px] uppercase tracking-[0.1em] text-[var(--muted)]">Per-item</h2>
        <p className="mt-1 text-[12px] text-[var(--muted-2)]">
          Every item page exposes a JSON export of its aggregate scores. The pattern is{' '}
          <code>/d/[directory]/[item]/item.json</code> — for example,{' '}
          <Link
            href="/d/ai-dev-tools/vercel-ai-sdk/item.json"
            className="underline-offset-2 hover:underline"
          >
            <code>/d/ai-dev-tools/vercel-ai-sdk/item.json</code>
          </Link>
          . Each item page also carries{' '}
          <code>&lt;link rel=&quot;alternate&quot; type=&quot;application/json&quot;&gt;</code>{' '}
          pointing at its JSON export, and item pages with ratings emit <code>Product</code> +{' '}
          <code>AggregateRating</code> JSON-LD from real rating data.
        </p>
      </section>
    </main>
  );
}

function FeedTable({ feeds }: { feeds: Feed[] }) {
  return (
    <table className="mt-3 w-full text-sm">
      <thead>
        <tr className="border-b text-left text-[11px] uppercase tracking-wide text-[var(--muted)]">
          <th className="py-2 pr-3">Path</th>
          <th className="py-2 pr-3">Format</th>
          <th className="py-2">Description</th>
        </tr>
      </thead>
      <tbody>
        {feeds.map((f) => (
          <tr key={f.path} className="border-b">
            <td className="py-2 pr-3 font-mono text-xs">
              <Link
                href={f.path}
                className="text-[var(--foreground)] underline-offset-2 hover:underline"
              >
                {f.path}
              </Link>
            </td>
            <td className="py-2 pr-3 font-mono text-xs text-[var(--muted)]">{f.kind}</td>
            <td className="py-2 text-sm text-[var(--muted)]">{f.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
