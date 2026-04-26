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
        "h-1.5 w-full overflow-hidden rounded-full bg-[var(--score-track)]",
        className,
      )}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={5}
      aria-valuenow={value}
    >
      <div className="h-full bg-[var(--score-fill)]" style={{ width: `${pct}%` }} />
    </div>
  );
}
