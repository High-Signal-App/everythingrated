import Link from "next/link";
import { Card, CardBody } from "@/components/atoms/card";
import { Badge } from "@/components/atoms/badge";
import type { DirectorySummary } from "@/lib/ratings";

export function DirectoryCard({ data }: { data: DirectorySummary }) {
  const { directory, itemCount, aspectCount } = data;
  const initials = directory.name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <Link href={`/d/${directory.slug}`} className="group block">
      <Card className="h-full overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-[var(--border-strong)] group-hover:shadow-lg">
        <CardBody className="relative flex h-full flex-col gap-5">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_20%_0%,var(--cool-surface),transparent_60%),radial-gradient(circle_at_88%_12%,var(--warm-surface),transparent_54%)]"
            aria-hidden
          />
          <div className="flex items-start justify-between gap-3">
            <div className="relative min-w-0">
              <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[12px] font-semibold tracking-tight shadow-sm">
                {initials}
              </span>
              <h3 className="text-[18px] font-semibold tracking-tight">
                {directory.name}
              </h3>
              <p className="mt-1 line-clamp-2 text-[12px] text-[var(--muted)]">
                {directory.description}
              </p>
            </div>
            <span className="relative rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[11px] text-[var(--muted)]">
              Directory
            </span>
          </div>

          <p className="relative text-[13px] leading-[1.6] text-[var(--muted)]">
            {directory.heroCopy}
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-3">
              <p className="num text-[20px] font-semibold leading-none tabular-nums">
                {itemCount}
              </p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                comparable items
              </p>
            </div>
            <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-3">
              <p className="num text-[20px] font-semibold leading-none tabular-nums">
                {aspectCount}
              </p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                rating axes
              </p>
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-[var(--border)] pt-3">
            <div className="flex items-center gap-2">
              <Badge tone="neutral">{itemCount} items</Badge>
              <Badge tone="outline">{aspectCount} aspects</Badge>
            </div>
            <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--muted)] group-hover:text-[var(--foreground)]">
              Explore <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </span>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
