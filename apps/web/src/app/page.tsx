import Link from "next/link";

import { Badge } from "@/components/atoms/badge";
import { ScoreBar } from "@/components/atoms/score-bar";
import { DirectoryCard } from "@/components/organisms/directory-card";
import { encodeCompareState } from "@/lib/comparison";
import { FOCUS_DIRECTORY_SLUG } from "@/lib/directory-focus";
import { listDirectories, listItemsWithAggregates } from "@/lib/ratings";

export const dynamic = "force-dynamic";

const features = [
  {
    title: "Axes that decide adoption",
    body: "AI dev libraries are scored on maintenance, community, license, API stability, footprint, and AI portability — the six dimensions the adopt/skip call actually turns on.",
  },
  {
    title: "One number per axis",
    body: "Every aspect gets its own average, plus an overall score across aspects. The detail stays visible instead of collapsing into one star.",
  },
  {
    title: "Anonymous, no account",
    body: "Rate without signing up. A cookie ties your ratings together so you can come back and update them — your latest rating counts.",
  },
];

const steps = [
  {
    n: "1",
    title: "Open the AI dev tools board",
    body: "Every tool sits on one board with per-axis averages side by side.",
  },
  {
    n: "2",
    title: "Open a tool",
    body: "See the per-aspect averages and how many people have rated it.",
  },
  {
    n: "3",
    title: "Rate the axes",
    body: "Give each aspect a 1–5. Your scores update the averages instantly.",
  },
];

export default async function LandingPage() {
  // Product focus (2026-07-03): the homepage sells one directory —
  // ai-dev-tools. Other seeded directories are PARKED (see
  // lib/directory-focus.ts): still reachable at /d/[slug], not promoted here.
  const directories = await listDirectories();
  const focus =
    directories.find((d) => d.directory.slug === FOCUS_DIRECTORY_SLUG) ?? null;
  const items = focus
    ? await listItemsWithAggregates(focus.directory.id, null)
    : [];

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
            {items.length} AI dev libraries · {focus?.aspectCount ?? 6} adoption axes
          </Badge>
          <h1 className="text-balance text-[40px] font-semibold leading-[1.05] tracking-[-0.025em] md:text-[64px]">
            Decide which AI dev library
            <br />
            <span className="text-[var(--muted)]">to adopt — axis by axis.</span>
          </h1>
          <p className="mt-6 max-w-[52ch] text-[16px] leading-[1.55] text-[var(--muted)]">
            A GitHub star count can&rsquo;t tell you whether a library will lock
            you in or ship a breaking change next month. EverythingRated scores{" "}
            {items.length} AI dev libraries on {focus?.aspectCount ?? 6} separate
            axes — maintenance, community, license, API stability, footprint, and
            AI portability — so the adoption trade-off is visible before you
            commit.
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
                  <p className="mt-1 text-[13px] leading-[1.55] text-[var(--muted)]">
                    {s.body}
                  </p>
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
            How confident is a rating?
          </h2>
          <p className="mt-3 max-w-[60ch] text-[13px] leading-[1.55] text-[var(--muted)]">
            An average score is only as trustworthy as what backs it. Two raters
            who disagree is not the same as twenty raters who agree. Each aspect
            shows its rating count next to the bar — use it to weight the
            number.
          </p>

          <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Low confidence */}
            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] p-5">
              <div className="flex items-center justify-between gap-3">
                <Badge tone="neutral">Low confidence</Badge>
                <span className="num text-[11px] text-[var(--muted)]">
                  2 ratings · scores 4, 2
                </span>
              </div>
              <div className="mt-4 flex items-center gap-3 text-[12px]">
                <span className="w-32 shrink-0 text-[var(--muted)]">
                  API stability
                </span>
                <ScoreBar value={3.0} className="flex-1" />
                <span className="num w-10 shrink-0 text-right tabular-nums">
                  3.0
                </span>
              </div>
              <p className="mt-4 text-[12px] leading-[1.55] text-[var(--muted)]">
                A 3.0 from two people who disagreed is mostly noise. The next
                rating could move it half a point in either direction. Treat
                aspects with fewer than ~5 ratings as a starting opinion, not
                a verdict.
              </p>
            </div>

            {/* High confidence */}
            <div className="rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--background)] p-5">
              <div className="flex items-center justify-between gap-3">
                <Badge tone="strong">High confidence</Badge>
                <span className="num text-[11px] text-[var(--muted)]">
                  24 ratings · mostly 4s and 5s
                </span>
              </div>
              <div className="mt-4 flex items-center gap-3 text-[12px]">
                <span className="w-32 shrink-0 text-[var(--muted)]">
                  API stability
                </span>
                <ScoreBar value={4.3} className="flex-1" />
                <span className="num w-10 shrink-0 text-right tabular-nums">
                  4.3
                </span>
              </div>
              <p className="mt-4 text-[12px] leading-[1.55] text-[var(--muted)]">
                A 4.3 from two dozen raters who broadly agreed is a real
                signal. One new rating barely moves the average, so the number
                you see is close to what you would get tomorrow.
              </p>
            </div>
          </div>

          <ul className="mt-7 grid grid-cols-1 gap-2 text-[12px] text-[var(--muted)] sm:grid-cols-2">
            <li>
              <span className="text-[var(--foreground)]">Rating count.</span>{" "}
              Shown next to every aspect — under ~5 is thin, 10+ is solid.
            </li>
            <li>
              <span className="text-[var(--foreground)]">Spread.</span> A 3.0
              built from 4s and 2s is different from a 3.0 built from a stack
              of 3s.
            </li>
            <li>
              <span className="text-[var(--foreground)]">Per axis, not per item.</span>{" "}
              A library can have a confident maintenance score and a thin
              stability score — read them separately.
            </li>
            <li>
              <span className="text-[var(--foreground)]">Re-rating counts.</span>{" "}
              Visitors can update their score, so the average tracks current
              opinion, not first impressions.
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
              Build a ranked list people can actually use
            </h2>
            <p className="mt-3 max-w-[54ch] text-[13px] leading-[1.55] text-[var(--muted)]">
              Rate a few tools, save your ranking, and share the final list.
              Instead of saying &ldquo;best AI tool,&rdquo; show exactly why one wins.
            </p>
            <Link
              href={`/d/${FOCUS_DIRECTORY_SLUG}`}
              className="mt-6 inline-flex h-11 items-center rounded-[var(--radius-sm)] bg-[var(--foreground)] px-6 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-90"
            >
              Make your list →
            </Link>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold">Best AI dev libraries</p>
                <p className="text-[12px] text-[var(--muted)]">
                  Ranked by stability, maintenance, and AI portability
                </p>
              </div>
              <Badge tone="outline">Public preview</Badge>
            </div>
            {[
              ["1", "Vercel AI SDK", "Best provider portability", "4.5"],
              ["2", "LangChain", "Largest ecosystem", "4.2"],
              ["3", "LiteLLM", "No model lock-in", "4.4"],
            ].map(([rank, name, note, score]) => (
              <div
                key={name}
                className="flex items-center gap-3 border-t border-[var(--border)] py-3 first:border-t-0"
              >
                <span className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[12px] font-semibold">
                  {rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{name}</p>
                  <p className="truncate text-[12px] text-[var(--muted)]">{note}</p>
                </div>
                <span className="num text-[13px] font-semibold tabular-nums">
                  {score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto w-full max-w-6xl px-6 py-14">
          <h2 className="text-[20px] font-semibold tracking-tight">
            Why multi-axis
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-5"
              >
                <h3 className="text-sm font-medium text-[var(--foreground)]">
                  {f.title}
                </h3>
                <p className="mt-2 text-[13px] leading-[1.55] text-[var(--muted)]">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The directory */}
      <section className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-[20px] font-semibold tracking-tight">
            The AI dev tools board
          </h2>
        </div>

        {focus === null ? (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] p-10 text-center text-[var(--muted)]">
            No data yet. Run{" "}
            <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5">
              pnpm db:seed:local
            </code>{" "}
            to load the starter set.
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
