import Link from "next/link";
import { Card, CardBody } from "@/components/atoms/card";
import { Badge } from "@/components/atoms/badge";
import { AspectRow } from "@/components/molecules/aspect-row";
import type { ItemWithAggregate } from "@/lib/ratings";

export function ItemCard({
  data,
  directorySlug,
}: {
  data: ItemWithAggregate;
  directorySlug: string;
}) {
  const yourRated = data.aspects.filter((a) => a.yourScore !== null);
  const yourMean =
    yourRated.length > 0
      ? yourRated.reduce((s, a) => s + (a.yourScore ?? 0), 0) / yourRated.length
      : null;
  const allRated =
    data.aspects.length > 0 && yourRated.length === data.aspects.length;
  const ctaLabel = yourMean === null
    ? "Rate this →"
    : allRated
      ? "Review →"
      : "Finish rating →";
  const overallPct = Math.max(0, Math.min(100, (data.overall / 5) * 100));
  const confidenceLabel = data.totalRaters >= 5
    ? "solid signal"
    : data.totalRaters > 0
      ? "early signal"
      : "unrated";

  return (
    <Link href={`/d/${directorySlug}/${data.item.slug}`} className="group block">
      <Card className="h-full overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-[var(--border-strong)] group-hover:shadow-lg">
        <CardBody className="flex h-full flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-[16px] font-semibold tracking-tight">
                {data.item.name}
              </h3>
              <p className="mt-1 line-clamp-2 text-[12px] text-[var(--muted)]">
                {data.item.description}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end">
              <span
                className="grid h-16 w-16 place-items-center rounded-full p-[3px]"
                style={{
                  background:
                    data.overall > 0
                      ? `conic-gradient(var(--score-fill-high) ${overallPct}%, var(--score-track) 0)`
                      : "var(--score-track)",
                }}
              >
                <span className="grid h-full w-full place-items-center rounded-full bg-[var(--surface)]">
                  <span className="num text-xl font-semibold leading-none tabular-nums">
                    {data.overall > 0 ? data.overall.toFixed(1) : "—"}
                  </span>
                </span>
              </span>
              <span className="mt-1 text-[10px] uppercase tracking-[0.08em] text-[var(--muted-2)]">
                {confidenceLabel}
              </span>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-2.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-3">
            {data.aspects.map((a) => (
              <AspectRow key={a.aspect.id} a={a} />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone="neutral">{data.totalRaters} rater{data.totalRaters === 1 ? "" : "s"}</Badge>
              {yourMean !== null ? (
                <Badge tone={allRated ? "strong" : "outline"}>
                  You:{" "}
                  <span className="num tabular-nums">{yourMean.toFixed(1)}</span>
                  {!allRated ? (
                    <span className="text-[var(--muted)]">
                      {" "}
                      ({yourRated.length}/{data.aspects.length})
                    </span>
                  ) : null}
                </Badge>
              ) : null}
            </div>
            <span className="text-[12px] text-[var(--muted)] group-hover:text-[var(--foreground)]">
              {ctaLabel}
            </span>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
