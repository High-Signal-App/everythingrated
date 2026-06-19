import Link from "next/link";
import { Badge } from "@/components/atoms/badge";
import { Card, CardBody } from "@/components/atoms/card";
import { ScoreBar } from "@/components/atoms/score-bar";
import { StackBuilder } from "@/components/organisms/stack-builder";
import { interpretQuery, weightsForAspectGroups } from "@/lib/query-intent";
import { listDirectories } from "@/lib/ratings";
import { buildStackResult } from "@/lib/stack";
import type { ScoredCandidate, StackResult } from "@/lib/stack-recommender";
import { ASPECT_SIGNALS, type ConstraintTag, type StackIntent } from "@/lib/stack-vocabulary";

export const dynamic = "force-dynamic";

function first(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function parseTags(csv: string): ConstraintTag[] {
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [key, value] = s.split(":");
      return key && value ? { key, value } : null;
    })
    .filter((t): t is ConstraintTag => t !== null);
}

function csvList(csv: string): string[] {
  return csv.split(",").map((s) => s.trim()).filter(Boolean);
}

/** Aspect-group ids whose keys are emphasised in the weights — for chip pre-fill. */
function boostIdsFromWeights(weights: Record<string, number>): string[] {
  return ASPECT_SIGNALS.filter((a) =>
    a.aspectKeys.some((k) => (weights[k] ?? 1) > 1),
  ).map((a) => a.id);
}

export default async function StackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = first(sp.q);
  const dirsParam = first(sp.dirs);
  const tagsParam = first(sp.tags);
  const boostParam = first(sp.boost);

  const structured = Boolean(dirsParam || tagsParam || boostParam);
  const base = interpretQuery(q);

  const intent: StackIntent = structured
    ? {
        directories: csvList(dirsParam),
        tags: parseTags(tagsParam),
        weights: weightsForAspectGroups(csvList(boostParam)),
      }
    : base;

  const allDirectories = (await listDirectories()).map((d) => ({
    slug: d.directory.slug,
    name: d.directory.name,
  }));

  const result: StackResult | null =
    intent.directories.length > 0 ? await buildStackResult(intent) : null;

  const boostIds = structured ? csvList(boostParam) : boostIdsFromWeights(base.weights);

  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 dot-grid" aria-hidden />
        <div className="relative mx-auto w-full max-w-4xl px-6 pb-10 pt-10 md:pb-14 md:pt-16">
          <Badge tone="outline" className="mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--foreground)]" />
            Stack builder
          </Badge>
          <h1 className="text-balance text-[34px] font-semibold leading-[1.05] tracking-[-0.025em] md:text-[48px]">
            Describe your project. Get a rated stack.
          </h1>
          <p className="mt-4 max-w-[56ch] text-[15px] leading-[1.55] text-[var(--muted)]">
            We read your description, figure out which categories you need, then
            pick the best-rated option in each — weighted by what you told us
            matters. Best-in-class per category, not a claim they&apos;re battle-tested together.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl space-y-8 px-6 py-10">
        <StackBuilder
          initialQuery={q}
          initialDirs={intent.directories}
          initialTags={intent.tags}
          initialBoosts={boostIds}
          allDirectories={allDirectories}
        />

        {result ? (
          <StackResults result={result} />
        ) : (
          <EmptyState />
        )}
      </section>
    </>
  );
}

function EmptyState() {
  const examples = [
    "Realtime chat app on Cloudflare Workers, need a fast database and auth, on a budget",
    "TypeScript SaaS: payments, transactional email, product analytics, and feature flags",
    "Side project — a meta-framework, an ORM, object storage, and self-hostable auth",
  ];
  return (
    <Card>
      <CardBody className="space-y-4">
        <h2 className="text-[16px] font-semibold">Try a description</h2>
        <ul className="space-y-2">
          {examples.map((ex) => (
            <li key={ex}>
              <Link
                href={`/stack?q=${encodeURIComponent(ex)}`}
                className="block rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
              >
                “{ex}”
              </Link>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

function StackResults({ result }: { result: StackResult }) {
  if (result.picks.length === 0) {
    return (
      <Card>
        <CardBody className="text-[14px] text-[var(--muted)]">
          We couldn&apos;t find rated items for those categories yet. Try adding
          a category above.
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[20px] font-semibold tracking-tight">Your recommended stack</h2>
        <span className="text-[12px] text-[var(--muted)]">
          {result.picks.length} categor{result.picks.length === 1 ? "y" : "ies"}
        </span>
      </div>

      {result.unknownDirectories.length > 0 && (
        <p className="text-[12px] text-[var(--muted)]">
          Unknown categories skipped: {result.unknownDirectories.join(", ")}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4">
        {result.picks.map((pick) => (
          <Card key={pick.directorySlug}>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
                  {pick.directoryName}
                </span>
                <Link
                  href={`/d/${pick.directorySlug}`}
                  className="text-[12px] text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  See all →
                </Link>
              </div>

              <PickRow candidate={pick.top} directorySlug={pick.directorySlug} primary />

              {pick.alternatives.length > 0 && (
                <div className="border-t border-[var(--border)] pt-3">
                  <p className="mb-2 text-[11px] text-[var(--muted)]">Alternatives</p>
                  <div className="space-y-2">
                    {pick.alternatives.map((alt) => (
                      <PickRow
                        key={alt.item.id}
                        candidate={alt}
                        directorySlug={pick.directorySlug}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      <p className="text-[12px] leading-[1.5] text-[var(--muted)]">
        Scores reflect current community ratings on this site (still sparse — POC).
        Constraint matches nudge ranking; they don&apos;t guarantee compatibility.
      </p>
    </div>
  );
}

function PickRow({
  candidate,
  directorySlug,
  primary,
}: {
  candidate: ScoredCandidate;
  directorySlug: string;
  primary?: boolean;
}) {
  const { item, base, topAspects, matchedTags } = candidate;
  const rated = base > 0;
  return (
    <div className={primary ? "" : "flex items-center justify-between gap-3"}>
      <div className={primary ? "" : "min-w-0"}>
        <div className="flex items-center gap-2">
          <Link
            href={`/d/${directorySlug}/${item.slug}`}
            className={
              primary
                ? "text-[18px] font-semibold tracking-tight hover:underline"
                : "truncate text-[14px] font-medium hover:underline"
            }
          >
            {item.name}
          </Link>
          {primary && <Badge tone="strong">Top pick</Badge>}
          {matchedTags.map((t) => (
            <Badge key={`${t.key}:${t.value}`} tone="outline">
              {t.value}
            </Badge>
          ))}
        </div>
        {primary && (
          <p className="mt-1 text-[13px] leading-[1.5] text-[var(--muted)]">{item.description}</p>
        )}
        {primary && topAspects.length > 0 && (
          <p className="mt-2 text-[12px] text-[var(--muted)]">
            Strong on{" "}
            {topAspects.map((a, i) => (
              <span key={a.key}>
                {i > 0 ? ", " : ""}
                <span className="text-[var(--foreground)]">{a.label}</span> ({a.avg.toFixed(1)})
              </span>
            ))}
          </p>
        )}
      </div>
      <div className={primary ? "mt-3 flex items-center gap-3" : "flex shrink-0 items-center gap-2"}>
        {primary && <div className="flex-1"><ScoreBar value={base} /></div>}
        <span className="num text-[15px] font-semibold tabular-nums">
          {rated ? base.toFixed(1) : "—"}
        </span>
      </div>
    </div>
  );
}
