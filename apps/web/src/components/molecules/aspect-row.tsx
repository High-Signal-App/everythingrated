import { ScoreBar } from "@/components/atoms/score-bar";
import type { AspectAverage } from "@/lib/ratings";

/** Read-only summary for a single aspect — used on the landing grid. */
export function AspectRow({ a }: { a: AspectAverage }) {
  return (
    <div className="grid grid-cols-[minmax(82px,1fr)_minmax(96px,1.15fr)_42px] items-center gap-3 text-[12px]">
      <span className="min-w-0 truncate text-[var(--muted)]">
        {a.aspect.label}
      </span>
      <div className="min-w-0">
        <ScoreBar value={a.avg} />
        <span className="mt-1 block text-[10px] text-[var(--muted-2)]">
          {a.count} rating{a.count === 1 ? "" : "s"}
        </span>
      </div>
      <span className="num shrink-0 text-right font-medium tabular-nums text-[var(--foreground)]">
        {a.count > 0 ? a.avg.toFixed(1) : "—"}
      </span>
    </div>
  );
}
