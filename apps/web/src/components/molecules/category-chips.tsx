import Link from "next/link";

import { cn } from "@/lib/cn";
import type { DirectorySummary } from "@/lib/ratings";

type Props = {
  directories: DirectorySummary[];
  label?: string;
  className?: string;
};

export function CategoryChips({ directories, label, className }: Props) {
  if (directories.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {label ? (
        <span className="mr-1 text-[11px] uppercase tracking-[0.1em] text-[var(--muted-2)]">
          {label}
        </span>
      ) : null}
      {directories.map(({ directory, itemCount }) => (
        <Link
          key={directory.id}
          href={`/d/${directory.slug}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[12px] font-medium text-[var(--foreground)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]"
        >
          <span>{directory.name}</span>
          <span className="num text-[11px] tabular-nums text-[var(--muted)]">
            {itemCount}
          </span>
        </Link>
      ))}
    </div>
  );
}
