import { notFound } from "next/navigation";
import Link from "next/link";
import { getDirectoryBySlug, listItemsWithAggregates } from "@/lib/ratings";
import { AspectRow } from "@/components/molecules/aspect-row";
import { Badge } from "@/components/atoms/badge";

export const dynamic = "force-dynamic";

export default async function SharedListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const name = params.name?.trim();
  const dirSlug = params.dir;
  const itemSlugsCsv = params.items;

  if (!dirSlug || !itemSlugsCsv) notFound();

  const itemSlugs = itemSlugsCsv.split(",").filter(Boolean);
  if (itemSlugs.length < 2) notFound();

  const directory = await getDirectoryBySlug(dirSlug);
  if (!directory) notFound();

  const allItems = await listItemsWithAggregates(directory.id, null);
  const slugToItem = new Map(allItems.map((it) => [it.item.slug, it]));
  const ranked = itemSlugs.flatMap((slug) => {
    const item = slugToItem.get(slug);
    return item ? [item] : [];
  });

  if (ranked.length < 2) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-14">
      <Link
        href={`/d/${dirSlug}`}
        className="text-[12px] text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        ← {directory.name}
      </Link>

      <Badge tone="outline" className="mb-4 mt-4">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--foreground)]" />
        Ranked list
      </Badge>

      <h1 className="text-[28px] font-semibold tracking-tight">
        {name || "Ranked list"}
      </h1>
      <p className="mt-2 text-[13px] text-[var(--muted)]">
        {ranked.length} item{ranked.length === 1 ? "" : "s"} · {directory.name}
      </p>

      <ol className="mt-8 divide-y divide-[var(--border)] rounded-[var(--radius-md)] border border-[var(--border)]">
        {ranked.map((data, index) => (
          <li key={data.item.id} className="px-5 py-4">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 w-6 shrink-0 text-[13px] font-semibold tabular-nums text-[var(--muted)]">
                #{index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/d/${dirSlug}/${data.item.slug}`}
                    className="text-[15px] font-semibold hover:underline"
                  >
                    {data.item.name}
                  </Link>
                  <span className="flex shrink-0 items-baseline gap-0.5">
                    <span className="num text-[20px] font-semibold tabular-nums leading-none">
                      {data.overall > 0 ? data.overall.toFixed(1) : "—"}
                    </span>
                    <span className="text-[11px] text-[var(--muted)]">/5</span>
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {data.aspects.slice(0, 3).map((a) => (
                    <AspectRow key={a.aspect.id} a={a} />
                  ))}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>

      {/* Make your list CTA */}
      <div className="mt-10 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
        <p className="text-[15px] font-semibold">Make your own list</p>
        <p className="mt-2 max-w-[40ch] mx-auto text-[13px] leading-[1.55] text-[var(--muted)]">
          Rate the tools yourself and build a ranked list that reflects your
          actual experience.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href={`/d/${dirSlug}`}
            className="inline-flex h-11 items-center rounded-[var(--radius-sm)] bg-[var(--foreground)] px-6 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-90"
          >
            Rate {directory.name} →
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-[var(--radius-sm)] border border-[var(--border-strong)] px-5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-2)]"
          >
            Browse directories
          </Link>
        </div>
      </div>
    </div>
  );
}
