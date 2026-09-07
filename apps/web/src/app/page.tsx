import Link from 'next/link';

import { Badge } from '@/components/atoms/badge';
import { ScoreBar } from '@/components/atoms/score-bar';
import { DirectoryCard } from '@/components/organisms/directory-card';
import { encodeCompareState } from '@/lib/comparison';
import { FOCUS_DIRECTORY_SLUG } from '@/lib/directory-focus';
import { listDirectories, listItemsWithAggregates } from '@/lib/ratings';

export const dynamic = 'force-dynamic';

const features = [
  {
    title: 'Axes that decide adoption',
    body: 'Compare tools using the axes on their board. Weight the trade-offs that matter to your workflow, and inspect the ratings behind each score.',
  },
  {
    title: 'One number per axis',
    body: 'Every aspect gets its own average, plus an overall score across aspects. The detail stays visible instead of collapsing into one star.',
  },
  {
    title: 'Anonymous, no account',
    body: 'Rate without signing up. A cookie ties your ratings together so you can come back and update them — your latest rating counts.',
  },
];

const steps = [
  {
    n: '1',
    title: 'Open the AI dev tools board',
    body: 'Every tool sits on one board with per-axis averages side by side.',
  },
  {
    n: '2',
    title: 'Open a tool',
    body: 'See the per-aspect averages and how many people have rated it.',
  },
  {
    n: '3',
    title: 'Rate the axes',
    body: 'Give each aspect a 1–5. Your scores update the averages instantly.',
  },
];

export default async function LandingPage() {
  // Product focus (2026-07-03): the homepage sells one directory —
  // ai-dev-tools. Other seeded directories are PARKED (see
  // lib/directory-focus.ts): still reachable at /d/[slug], not promoted here.
  const directories = await listDirectories();
  const focus = directories.find((d) => d.directory.slug === FOCUS_DIRECTORY_SLUG) ?? null;
  const items = focus ? await listItemsWithAggregates(focus.directory.id, null) : [];

  const axisLabels = items[0]?.aspects.map(({ aspect }) => aspect.label).join(', ');

  const featuredPairs: Array<{ label: string; href: string }> = [];
  const top = [...items]
    .sort((a, b) => b.totalRaters - a.totalRaters || b.overall - a.overall)
    .slice(0, 3);
  for (let i = 0; i < top.length; i++) {
    for (let j = i + 1; j < top.length; j++) {
      const a = top[i];
      const b = top[j];
      featuredPairs.push({
        label: `${a.item.name} vs ${b.item.name}`,
        href: `/d/${FOCUS_DIRECTORY_SLUG}?${encodeCompareState([a.item.id, b.item.id], {})}#compare`,
      });
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 dot-grid" aria-hidden />
        <div className="relative mx-auto w-full max-w-6xl px-6 pb-16 pt-14 md:pb-24 md:pt-24">
          <Badge tone="outline" className="mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--foreground)]" />
            {items.length} AI developer tools · anonymous opinions
          </Badge>
          <h1 className="text-balance text-[40px] font-semibold leading-[1.05] tracking-[-0.025em] md:text-[64px]">
            EverythingRated — compare AI developer tools
            <br />
            <span className="text-[var(--muted)]">axis by axis.</span>
          </h1>
          <p className="mt-6 max-w-[52ch] text-[16px] leading-[1.55] text-[var(--muted)]">
            Compare anonymous opinions of AI developer tools, with separate scores for each
            trade-off.{' '}
            {axisLabels
              ? `Current board axes: ${axisLabels}.`
              : 'Open the board to see its rating rubric.'}{' '}
            Use the scores to guide your own evaluation, not as benchmark results.
          </p>
          <p className="mt-4 max-w-[60ch] text-[13px] leading-[1.55] text-[var(--muted)]">
            This is an early experiment. Starter ratings include owner opinions; small samples are
            not community consensus. Each tool and axis shows its own rating count.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link
              href={`/d/${FOCUS_DIRECTORY_SLUG}`}
              className="inline-flex h-11 items-center rounded-[var(--radius-sm)] bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-90"
            >
              Compare AI dev tools
            </Link>
          </div>
          {featuredPairs.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] uppercase tracking-[0.1em] text-[var(--muted-2)]">
                Featured comparisons
              </span>
              {featuredPairs.map((pair) => (
                <Link
                  key={pair.href}
                  href={pair.href}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[12px] font-medium text-[var(--foreground)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]"
                >
                  {pair.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Post-example: rate it yourself CTA */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto w-full max-w-6xl px-6 py-10 md:py-12">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--muted-2)]">
            Your turn
          </p>
          <h2 className="mt-2 text-[22px] font-semibold tracking-tight">
            Rate a tool yourself — takes 30 seconds
          </h2>
          <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-sm font-semibold">
                  {s.n}
                </span>
                <div>
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="mt-1 text-[13px] leading-[1.55] text-[var(--muted)]">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link
              href={`/d/${FOCUS_DIRECTORY_SLUG}`}
              className="inline-flex h-11 items-center rounded-[var(--radius-sm)] bg-[var(--foreground)] px-6 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-90"
            >
              Start rating →
            </Link>
          </div>
        </div>
      </section>

      {/* Rating confidence explainer */}
      <section className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto w-full max-w-6xl px-6 py-14">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--muted-2)]">
            Reading the numbers
          </p>
          <h2 className="mt-2 text-[20px] font-semibold tracking-tight">
            How much evidence backs a rating?
          </h2>
          <p className="mt-3 max-w-[60ch] text-[13px] leading-[1.55] text-[var(--muted)]">
            Counts describe how many anonymous visitor identities contributed, not verified people.
            More ratings can make an average less sensitive to one opinion, but cannot establish
            accuracy, independence, or agreement. The examples below are illustrative, not live
            scores.
          </p>

          <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Low confidence */}
            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] p-5">
              <div className="flex items-center justify-between gap-3">
                <Badge tone="neutral">Illustrative: small sample</Badge>
                <span className="num text-[11px] text-[var(--muted)]">2 ratings · scores 4, 2</span>
              </div>
              <div className="mt-4 flex items-center gap-3 text-[12px]">
                <span className="w-32 shrink-0 text-[var(--muted)]">Example axis</span>
                <ScoreBar value={3.0} className="flex-1" />
                <span className="num w-10 shrink-0 text-right tabular-nums">3.0</span>
              </div>
              <p className="mt-4 text-[12px] leading-[1.55] text-[var(--muted)]">
                Two opinions give little evidence about how a tool will work for you. Treat the
                average as a starting point for your own trial.
              </p>
            </div>

            {/* High confidence */}
            <div className="rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--background)] p-5">
              <div className="flex items-center justify-between gap-3">
                <Badge tone="strong">Illustrative: larger sample</Badge>
                <span className="num text-[11px] text-[var(--muted)]">
                  24 ratings · mostly 4s and 5s
                </span>
              </div>
              <div className="mt-4 flex items-center gap-3 text-[12px]">
                <span className="w-32 shrink-0 text-[var(--muted)]">Example axis</span>
                <ScoreBar value={4.3} className="flex-1" />
                <span className="num w-10 shrink-0 text-right tabular-nums">4.3</span>
              </div>
              <p className="mt-4 text-[12px] leading-[1.55] text-[var(--muted)]">
                A larger sample is less sensitive to one new score. It can still be biased or
                outdated, and does not guarantee that you will have the same experience.
              </p>
            </div>
          </div>

          <ul className="mt-7 grid grid-cols-1 gap-2 text-[12px] text-[var(--muted)] sm:grid-cols-2">
            <li>
              <span className="text-[var(--foreground)]">Rating count.</span> Shown next to every
              aspect. Small samples need particular caution; no count guarantees reliability.
            </li>
            <li>
              <span className="text-[var(--foreground)]">Averages have limits.</span> Scores and
              counts alone do not show whether contributors agreed.
            </li>
            <li>
              <span className="text-[var(--foreground)]">Read each axis.</span> A tool can have more
              ratings on one aspect than another. Missing ratings are not zero scores.
            </li>
            <li>
              <span className="text-[var(--foreground)]">Re-rating counts.</span> Visitors can
              update their score, so the average tracks current opinion, not first impressions.
            </li>
          </ul>
        </div>
      </section>

      {/* Shareable ranked-list preview */}
      <section className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 md:grid-cols-[0.9fr_1.1fr] md:items-center md:py-14">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--muted-2)]">
              Shareable lists
            </p>
            <h2 className="mt-2 text-[22px] font-semibold tracking-tight">
              Share a comparison with its context
            </h2>
            <p className="mt-3 max-w-[54ch] text-[13px] leading-[1.55] text-[var(--muted)]">
              Choose tools, adjust the axis weights, and copy the comparison URL. The link preserves
              your selection and weights; scores reflect current ratings when opened.
            </p>
            <Link
              href={`/d/${FOCUS_DIRECTORY_SLUG}`}
              className="mt-6 inline-flex h-11 items-center rounded-[var(--radius-sm)] bg-[var(--foreground)] px-6 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-90"
            >
              Build a comparison →
            </Link>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold">Tools on the current board</p>
                <p className="text-[12px] text-[var(--muted)]">
                  Most rated first · counts are per tool
                </p>
              </div>
              <Badge tone="outline">Current data</Badge>
            </div>
            {top.map(({ item, overall, totalRaters }, index) => (
              <div
                key={item.id}
                className="flex items-center gap-3 border-t border-[var(--border)] py-3 first:border-t-0"
              >
                <span className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[12px] font-semibold">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{item.name}</p>
                  <p className="truncate text-[12px] text-[var(--muted)]">
                    {totalRaters} rater{totalRaters === 1 ? '' : 's'} ·{' '}
                    {totalRaters < 5 ? 'Early signal' : 'Anonymous opinions'}
                  </p>
                </div>
                <span className="num text-[13px] font-semibold tabular-nums">
                  {totalRaters > 0 ? overall.toFixed(1) : '—'}
                </span>
              </div>
            ))}
            {top.length === 0 && (
              <p className="text-sm text-[var(--muted)]">No tools available yet.</p>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto w-full max-w-6xl px-6 py-14">
          <h2 className="text-[20px] font-semibold tracking-tight">Why multi-axis</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-5"
              >
                <h3 className="text-sm font-medium text-[var(--foreground)]">{f.title}</h3>
                <p className="mt-2 text-[13px] leading-[1.55] text-[var(--muted)]">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The directory */}
      <section className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-[20px] font-semibold tracking-tight">The AI dev tools board</h2>
        </div>

        {focus === null ? (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] p-10 text-center text-[var(--muted)]">
            The board has no data available yet. Please check back later.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <DirectoryCard data={focus} />
          </div>
        )}
      </section>
    </>
  );
}
