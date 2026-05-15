import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardBody } from "@/components/atoms/card";
import { listDirectories, listItemsWithAggregates } from "@/lib/ratings";

export const metadata: Metadata = {
  title: "Trending — EverythingRated",
  description: "Most-rated items across every directory.",
};

export const dynamic = "force-dynamic";

interface Row {
  directorySlug: string;
  directoryName: string;
  itemSlug: string;
  itemName: string;
  raters: number;
  overall: number;
}

export default async function TrendingPage() {
  const dirs = await listDirectories().catch(() => []);

  const rows: Row[] = [];
  for (const d of dirs) {
    const items = await listItemsWithAggregates(d.directory.id, null).catch(() => []);
    for (const i of items) {
      if (i.totalRaters > 0) {
        rows.push({
          directorySlug: d.directory.slug,
          directoryName: d.directory.name,
          itemSlug: i.item.slug,
          itemName: i.item.name,
          raters: i.totalRaters,
          overall: i.overall,
        });
      }
    }
  }
  rows.sort((a, b) => b.raters - a.raters || b.overall - a.overall);
  const top = rows.slice(0, 50);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="text-[12px] text-[var(--muted)] hover:text-[var(--foreground)]">
        ← All directories
      </Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">Trending</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Most-rated items across every directory, in descending order of unique raters.
      </p>

      {top.length === 0 ? (
        <Card className="mt-8">
          <CardBody>
            <h2 className="text-base font-semibold">Nothing trending yet</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Rate something — it&apos;ll appear here.
            </p>
          </CardBody>
        </Card>
      ) : (
        <ol className="mt-8 divide-y divide-[var(--border)]">
          {top.map((r, i) => (
            <li key={`${r.directorySlug}/${r.itemSlug}`} className="flex items-center gap-4 py-3">
              <span className="w-6 text-right tabular-nums text-xs text-[var(--muted)]">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/d/${r.directorySlug}/${r.itemSlug}`}
                  className="block truncate text-sm font-medium hover:underline"
                >
                  {r.itemName}
                </Link>
                <Link
                  href={`/d/${r.directorySlug}`}
                  className="text-xs text-[var(--muted)] hover:underline"
                >
                  {r.directoryName}
                </Link>
              </div>
              <div className="text-right text-xs tabular-nums">
                <div>{r.raters} rater{r.raters === 1 ? "" : "s"}</div>
                <div className="text-[var(--muted)]">{r.overall.toFixed(1)}/5</div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
