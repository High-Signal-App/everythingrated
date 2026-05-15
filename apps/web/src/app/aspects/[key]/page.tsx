import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { topItemsByAspectKey } from "@/lib/ratings";

export const dynamic = "force-dynamic";

interface Params {
  key: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { key } = await params;
  return {
    title: `${decodeURIComponent(key)} — EverythingRated`,
    description: `Top items rated on the "${decodeURIComponent(key)}" axis across every directory.`,
  };
}

export default async function AspectLeaderboardPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { key: raw } = await params;
  const key = decodeURIComponent(raw);
  if (!/^[a-z0-9_-]+$/i.test(key)) notFound();

  const rows = await topItemsByAspectKey(key, 50);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/aspects"
        className="text-[12px] text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        ← Aspects
      </Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">
        Top on <span className="font-mono">{key}</span>
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Items ranked by unique raters, then by mean score on this axis.
      </p>

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--muted)]">
          No ratings on this aspect yet across any directory.
        </p>
      ) : (
        <ol className="mt-6 divide-y divide-[var(--border)]">
          {rows.map((r, i) => (
            <li
              key={`${r.directory.slug}/${r.item.slug}`}
              className="flex items-center gap-4 py-3"
            >
              <span className="w-6 text-right tabular-nums text-xs text-[var(--muted)]">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/d/${r.directory.slug}/${r.item.slug}`}
                  className="block truncate text-sm font-medium hover:underline"
                >
                  {r.item.name}
                </Link>
                <Link
                  href={`/d/${r.directory.slug}`}
                  className="text-xs text-[var(--muted)] hover:underline"
                >
                  {r.directory.name}
                </Link>
              </div>
              <div className="text-right text-xs tabular-nums">
                <div className="text-base font-semibold">{r.avg.toFixed(1)}</div>
                <div className="text-[var(--muted)]">
                  {r.raters} rater{r.raters === 1 ? "" : "s"}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
