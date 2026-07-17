import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/atoms/badge';
import { CategoryChips } from '@/components/molecules/category-chips';
import { RateRow } from '@/components/molecules/rate-row';
import { isParkedDirectory } from '@/lib/directory-focus';
import { getItemAggregate, listDirectories } from '@/lib/ratings';
import { readVisitorId } from '@/lib/visitor';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ directory: string; item: string }>;
}): Promise<Metadata> {
  const { directory: dirSlug, item: itemSlug } = await params;
  const result = await getItemAggregate(dirSlug, itemSlug, null);
  if (!result) return {};
  const { directory, data } = result;
  const title = `${data.item.name} — ${directory.name} ratings`;
  const description = data.item.description;
  return {
    title,
    description,
    alternates: {
      canonical: `/d/${directory.slug}/${data.item.slug}`,
      types: {
        'application/json': [
          {
            url: `/d/${directory.slug}/${data.item.slug}/item.json`,
            title: `${data.item.name} — JSON`,
          },
        ],
      },
    },
  };
}

export default async function ItemPage({
  params,
}: {
  params: Promise<{ directory: string; item: string }>;
}) {
  const { directory: dirSlug, item: itemSlug } = await params;
  const visitorId = await readVisitorId();
  const [result, allDirectories] = await Promise.all([
    getItemAggregate(dirSlug, itemSlug, visitorId),
    listDirectories(),
  ]);
  if (!result) notFound();
  const { directory, data } = result;

  // JSON-LD: Product + AggregateRating, only when there are real ratings.
  // Overall is the mean of per-aspect averages on a 1–5 scale; ratingCount is
  // the total number of individual aspect ratings submitted (current view).
  const ratedAspects = data.aspects.filter((a) => a.count > 0);
  const ratingCount = ratedAspects.reduce((s, a) => s + a.count, 0);
  const jsonLd =
    ratingCount > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: data.item.name,
          description: data.item.description,
          url: data.item.websiteUrl,
          category: directory.name,
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: Number(data.overall.toFixed(2)),
            bestRating: 5,
            worstRating: 1,
            ratingCount,
          },
          ...(data.item.logoUrl ? { image: data.item.logoUrl } : {}),
        }
      : null;
  const otherDirectories = allDirectories.filter(
    (d) =>
      d.directory.id !== directory.id &&
      d.itemCount > 0 &&
      // Product focus (2026-07-03): only the focus directory is promoted.
      // Parked directories (databases, hosting, …) are hidden from
      // cross-directory "Rate next" chips — see lib/directory-focus.ts.
      !isParkedDirectory(d.directory.slug)
  );
  const yourRatedAspects = data.aspects.filter((a) => a.yourScore !== null);
  const yourMean =
    yourRatedAspects.length > 0
      ? yourRatedAspects.reduce((s, a) => s + (a.yourScore ?? 0), 0) / yourRatedAspects.length
      : null;
  const allRated = data.aspects.length > 0 && yourRatedAspects.length === data.aspects.length;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-14">
      {jsonLd ? (
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data from real rating aggregates
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      <div className="flex items-center gap-2 text-[12px] text-[var(--muted)]">
        <Link href="/" className="hover:text-[var(--foreground)]">
          All directories
        </Link>
        <span>/</span>
        <Link href={`/d/${directory.slug}`} className="hover:text-[var(--foreground)]">
          {directory.name}
        </Link>
      </div>

      <header className="mt-6 flex flex-col items-start justify-between gap-6 border-b border-[var(--border)] pb-8 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-[36px] font-semibold tracking-tight">{data.item.name}</h1>
          <p className="mt-2 max-w-xl text-[14px] text-[var(--muted)]">{data.item.description}</p>
          <div className="mt-3 flex items-center gap-2">
            <a
              href={data.item.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[12px] text-[var(--muted)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
            >
              {new URL(data.item.websiteUrl).hostname} ↗
            </a>
            <Badge tone="neutral">
              {data.totalRaters} rater{data.totalRaters === 1 ? '' : 's'}
            </Badge>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="num text-5xl font-semibold tabular-nums">
            {data.overall > 0 ? data.overall.toFixed(1) : '—'}
          </span>
          <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--muted-2)]">
            Overall / 5
          </span>
        </div>
      </header>

      <section className="mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-[12px] uppercase tracking-[0.1em] text-[var(--muted)]">
            Rate across aspects
          </h2>
          <div className="flex items-center gap-2 text-[12px] text-[var(--muted)]">
            <span aria-live="polite">
              You: {yourRatedAspects.length} / {data.aspects.length} rated
              {yourMean !== null ? (
                <>
                  {' '}
                  · avg{' '}
                  <span className="num tabular-nums text-[var(--foreground)]">
                    {yourMean.toFixed(1)}
                  </span>
                </>
              ) : null}
            </span>
            {allRated ? <Badge tone="strong">Complete</Badge> : null}
          </div>
        </div>
        <p className="mt-1 text-[12px] text-[var(--muted-2)]">
          One rating per aspect per visitor — change anytime, your latest counts. Prior ratings are
          kept for history and trends (0001).
        </p>
        <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-5">
          {data.aspects.map((a) => (
            <RateRow
              key={a.aspect.id}
              itemId={data.item.id}
              itemSlug={data.item.slug}
              directorySlug={directory.slug}
              initial={a}
            />
          ))}
        </div>
      </section>

      {otherDirectories.length > 0 && (
        <section className="mt-10 border-t border-[var(--border)] pt-8">
          <h2 className="text-[12px] uppercase tracking-[0.1em] text-[var(--muted)]">Rate next</h2>
          <p className="mt-1 text-[12px] text-[var(--muted-2)]">
            Different category, different axes — pick another to keep going.
          </p>
          <CategoryChips className="mt-3" directories={otherDirectories} />
        </section>
      )}
    </div>
  );
}
