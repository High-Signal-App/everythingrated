"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { compareItems, encodeCompareState, type WeightMap } from "@/lib/comparison";
import type { ItemWithAggregate } from "@/lib/ratings";
import { Card, CardBody } from "@/components/atoms/card";
import { ScoreBar } from "@/components/atoms/score-bar";

export function ComparisonBoard({
  items,
  initialSelectedIds,
  initialWeights,
}: {
  items: ItemWithAggregate[];
  initialSelectedIds: string[];
  initialWeights: WeightMap;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [weights, setWeights] = useState<WeightMap>(initialWeights);
  const aspects = items[0]?.aspects.map((a) => a.aspect) ?? [];
  const rows = useMemo(() => compareItems(items, selectedIds, weights), [items, selectedIds, weights]);

  function sync(nextSelectedIds: string[], nextWeights: WeightMap) {
    const query = encodeCompareState(nextSelectedIds, nextWeights);
    router.replace(query ? `?${query}` : "?", { scroll: false });
  }

  function toggleItem(id: string) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((selected) => selected !== id)
      : [...selectedIds, id].slice(0, 5);
    setSelectedIds(next);
    sync(next, weights);
  }

  function setWeight(key: string, value: number) {
    const next = { ...weights, [key]: value };
    if (value === 1) delete next[key];
    setWeights(next);
    sync(selectedIds, next);
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-14">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight">Comparison board</h2>
          <p className="mt-1 text-[13px] text-[var(--muted)]">
            Select 2-5 items, tune the axis weights, and share the URL for this exact tradeoff.
          </p>
        </div>
        <span className="text-[12px] text-[var(--muted)]">{selectedIds.length}/5 selected</span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardBody className="space-y-4">
            <div>
              <h3 className="text-[13px] font-semibold">Items</h3>
              <div className="mt-3 space-y-2">
                {items.map((item) => (
                  <label key={item.item.id} className="flex items-center gap-2 text-[13px]">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.item.id)}
                      onChange={() => toggleItem(item.item.id)}
                      disabled={!selectedIds.includes(item.item.id) && selectedIds.length >= 5}
                    />
                    <span>{item.item.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[13px] font-semibold">Weights</h3>
              <div className="mt-3 space-y-3">
                {aspects.map((aspect) => (
                  <label key={aspect.id} className="block text-[12px] text-[var(--muted)]">
                    <span className="mb-1 flex justify-between">
                      <span>{aspect.label}</span>
                      <span>{weights[aspect.key] ?? 1}x</span>
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.5"
                      value={weights[aspect.key] ?? 1}
                      onChange={(event) => setWeight(aspect.key, Number(event.target.value))}
                      className="w-full"
                    />
                  </label>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            {rows.length < 2 ? (
              <p className="text-[13px] text-[var(--muted)]">Pick at least two items to compare.</p>
            ) : (
              <div className="space-y-5">
                {rows.map((row, index) => (
                  <div key={row.item.id} className="border-b border-[var(--border)] pb-4 last:border-0 last:pb-0">
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[12px] uppercase tracking-[0.08em] text-[var(--muted)]">#{index + 1}</p>
                        <h3 className="text-[16px] font-semibold">{row.item.name}</h3>
                      </div>
                      <span className="num text-2xl font-semibold">{row.total.toFixed(1)}</span>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      {row.tradeoffs.map((tradeoff) => (
                        <div key={tradeoff.aspect.id}>
                          <div className="mb-1 flex justify-between text-[12px] text-[var(--muted)]">
                            <span>{tradeoff.aspect.label}</span>
                            <span>{tradeoff.raw.toFixed(1)} x {tradeoff.weight}</span>
                          </div>
                          <ScoreBar value={tradeoff.raw} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
