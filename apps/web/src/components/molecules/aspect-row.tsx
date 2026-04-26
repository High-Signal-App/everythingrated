import type { AspectAverage } from "@/lib/ratings";
import { ScoreBar } from "@/components/atoms/score-bar";

/** Read-only summary for a single aspect — used on the landing grid. */
export function AspectRow({ a }: { a: AspectAverage }) {
  return (
    <div className="flex items-center gap-3 text-[12px]">
      <span className="w-32 shrink-0 text-[var(--muted)]">{a.aspect.label}</span>
      <ScoreBar value={a.avg} className="flex-1" />
      <span className="num w-10 shrink-0 text-right tabular-nums text-[var(--foreground)]">
        {a.count > 0 ? a.avg.toFixed(1) : "—"}
      </span>
    </div>
  );
}
