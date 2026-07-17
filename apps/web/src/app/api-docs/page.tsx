import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'API & feeds — EverythingRated',
  description: 'Public endpoints for each directory — JSON items, RSS feed, random-item redirect.',
};

interface Endpoint {
  path: string;
  format: string;
  description: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    path: '/d/[slug]/items.json',
    format: 'JSON',
    description: 'All items in a directory + per-aspect aggregate scores.',
  },
  {
    path: '/d/[slug]/rss',
    format: 'RSS 2.0',
    description: 'Items in a directory as an RSS feed.',
  },
  {
    path: '/d/[slug]/random',
    format: 'redirect',
    description: 'Bounces to a random item in the directory.',
  },
  {
    path: '/sitemap.xml',
    format: 'XML',
    description: 'All public directories + items.',
  },
  {
    path: '/robots.txt',
    format: 'text',
    description: 'Crawler rules.',
  },
];

export default function ApiDocsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="text-[12px] text-[var(--muted)] hover:text-[var(--foreground)]">
        ← All directories
      </Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">API & feeds</h1>
      <p className="mt-3 text-sm text-[var(--muted)]">
        Public, read-only. Substitute <code>[slug]</code> with any directory&apos;s slug (e.g.{' '}
        <code>ai-dev-tools</code>). See also the{' '}
        <Link href="/feeds" className="underline-offset-2 hover:underline">
          feeds index
        </Link>{' '}
        for a browsable list of every JSON and RSS endpoint.
      </p>

      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wide text-[var(--muted)]">
            <th className="py-2">Path</th>
            <th className="py-2">Format</th>
            <th className="py-2">Description</th>
          </tr>
        </thead>
        <tbody>
          {ENDPOINTS.map((e) => (
            <tr key={e.path} className="border-b">
              <td className="py-2 pr-3 font-mono text-xs">{e.path}</td>
              <td className="py-2 pr-3 font-mono text-xs text-[var(--muted)]">{e.format}</td>
              <td className="py-2 text-sm">{e.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
