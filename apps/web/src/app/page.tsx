import { listItemsWithAggregates } from "@/lib/ratings";
import { readVisitorId } from "@/lib/visitor";
import { ItemCard } from "@/components/organisms/item-card";
import { Badge } from "@/components/atoms/badge";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const visitorId = await readVisitorId();
  const items = await listItemsWithAggregates(visitorId);

  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 dot-grid" aria-hidden />
        <div className="relative mx-auto w-full max-w-6xl px-6 pb-16 pt-14 md:pb-24 md:pt-24">
          <Badge tone="outline" className="mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--foreground)]" />
            POC · AI dev tools
          </Badge>
          <h1 className="text-balance text-[40px] font-semibold leading-[1.05] tracking-[-0.025em] md:text-[64px]">
            Multi-axis ratings
            <br />
            <span className="text-[var(--muted)]">for the things devs use.</span>
          </h1>
          <p className="mt-6 max-w-[52ch] text-[16px] leading-[1.55] text-[var(--muted)]">
            One stars-out-of-five hides everything that matters. EverythingRated
            scores every tool across speed, accuracy, cost, ergonomics, and
            integration depth — so you can see the trade-offs.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-[20px] font-semibold tracking-tight">
            AI developer tools
          </h2>
          <span className="text-[12px] text-[var(--muted)]">
            {items.length} tools · 5 aspects each
          </span>
        </div>

        {items.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] p-10 text-center text-[var(--muted)]">
            No items yet. Run <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5">pnpm db:seed</code> to load the AI dev tools.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => (
              <ItemCard key={it.item.id} data={it} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
