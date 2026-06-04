import { cn } from "@/lib/cn";

/** A static 0-5 horizontal bar — average score with optional label. */
export function ScoreBar({
  value,
  className,
}: {
  value: number; // 0..5
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-[var(--score-track)] ring-1 ring-inset ring-[var(--border)]",
        className,
      )}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={5}
      aria-valuenow={value}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-[var(--score-fill)] via-[var(--score-fill-mid)] to-[var(--score-fill-high)] transition-[width]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
