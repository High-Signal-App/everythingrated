"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { trackCompareViewOpened } from "@/lib/analytics";
import { compareItems, encodeCompareState, MAX_COMPARE_ITEMS, type WeightMap } from "@/lib/comparison";
import type { ItemWithAggregate } from "@/lib/ratings";
import { Card, CardBody } from "@/components/atoms/card";
import { ScoreBar } from "@/components/atoms/score-bar";
import { Badge } from "@/components/atoms/badge";

export function ComparisonBoard({
  directorySlug,
  items,
  initialSelectedIds,
  initialWeights,
}: {
  directorySlug: string;
  items: ItemWithAggregate[];
  initialSelectedIds: string[];
  initialWeights: WeightMap;
}) {
  const router = useRouter();
  const itemIds = useMemo(() => new Set(items.map((item) => item.item.id)), [items]);
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    initialSelectedIds.filter((id) => itemIds.has(id)).slice(0, MAX_COMPARE_ITEMS),
  );
  const [weights, setWeights] = useState<WeightMap>(initialWeights);
  const trackedSelections = useRef<Set<string>>(new Set());
  const aspects = items[0]?.aspects.map((a) => a.aspect) ?? [];
  const rows = useMemo(() => compareItems(items, selectedIds, weights), [items, selectedIds, weights]);
  const selectedItems = useMemo(
    () => selectedIds
      .map((id) => items.find((item) => item.item.id === id))
      .filter((item): item is ItemWithAggregate => Boolean(item)),
    [items, selectedIds],
  );
  const suggestedItems = useMemo(
    () => items.filter((item) => !selectedIds.includes(item.item.id)).slice(0, 4),
    [items, selectedIds],
  );
  const isAtMax = selectedIds.length >= MAX_COMPARE_ITEMS;

  useEffect(() => {
    if (rows.length < 2) return;
    const key = rows.map((row) => row.item.id).sort().join(",");
    if (trackedSelections.current.has(key)) return;
    trackedSelections.current.add(key);
    trackCompareViewOpened({ directory: directorySlug, itemCount: rows.length });
  }, [directorySlug, rows]);

  function sync(nextSelectedIds: string[], nextWeights: WeightMap) {
    const query = encodeCompareState(nextSelectedIds, nextWeights);
    router.replace(query ? `?${query}` : "?", { scroll: false });
  }

  function toggleItem(id: string) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((selected) => selected !== id)
      : [...selectedIds, id].slice(0, MAX_COMPARE_ITEMS);
    setSelectedIds(next);
    sync(next, weights);
  }

  function clearItems() {
    setSelectedIds([]);
    sync([], weights);
  }

  function setWeight(key: string, value: number) {
    const next = { ...weights, [key]: value };
    if (value === 1) delete next[key];
    setWeights(next);
    sync(selectedIds, next);
  }

  return (
    <section id="compare" className="mx-auto w-full max-w-6xl scroll-mt-20 px-6 pb-14">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight">Comparison board</h2>
          <p className="mt-1 text-[13px] text-[var(--muted)]">
            Add 2-{MAX_COMPARE_ITEMS} items, tune the axis weights, and share the URL for this exact tradeoff.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={clearItems}
              className="text-[12px] text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Clear
            </button>
          )}
          <span className="text-[12px] text-[var(--muted)]">
            {selectedIds.length}/{MAX_COMPARE_ITEMS} selected
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="overflow-hidden">
          <CardBody className="space-y-5">
            <div>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[13px] font-semibold">Items</h3>
                <Badge tone={selectedIds.length > 1 ? "strong" : "neutral"}>
                  {selectedIds.length > 1 ? "Ready" : "Pick 2+"}
                </Badge>
              </div>
              {selectedItems.length === 0 ? (
                <p className="mt-2 text-[12px] text-[var(--muted)]">
                  Your shortlist is empty. Add a few items below to compare.
                </p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedItems.map((item) => (
                    <button
                      key={item.item.id}
                      type="button"
                      onClick={() => toggleItem(item.item.id)}
                      className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-[12px] text-[var(--foreground)] hover:border-[var(--border-strong)]"
                    >
                      {item.item.name} x
                    </button>
                  ))}
                </div>
              )}
              {isAtMax && (
                <p className="mt-2 text-[12px] text-[var(--muted)]">
                  Shortlist full. Remove an item before adding another.
                </p>
              )}
              <div className="mt-4 space-y-1.5">
                {items.map((item) => (
                  <label
                    key={item.item.id}
                    className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] px-2 py-1.5 text-[13px] hover:bg-[var(--surface-2)]"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.item.id)}
                      onChange={() => toggleItem(item.item.id)}
                      disabled={!selectedIds.includes(item.item.id) && isAtMax}
                    />
                      <span className="truncate">{item.item.name}</span>
                    </span>
                    <span className="num shrink-0 text-[12px] text-[var(--muted)] tabular-nums">
                      {item.overall > 0 ? item.overall.toFixed(1) : "—"}
                    </span>
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

        <Card className="overflow-hidden">
          <CardBody>
            {rows.length < 2 ? (
              <div className="relative overflow-hidden rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] bg-[linear-gradient(135deg,var(--cool-surface),var(--surface)_48%,var(--warm-surface))] p-6">
                <div
                  className="pointer-events-none absolute inset-0 dot-grid opacity-60"
                  aria-hidden
                />
                <div className="relative mx-auto max-w-xl text-center">
                  <Badge tone="outline">
                    {selectedIds.length === 0 ? "No shortlist yet" : "One more needed"}
                  </Badge>
                  <p className="mt-4 text-[18px] font-semibold tracking-tight">
                    {selectedIds.length === 0
                      ? "Build a shortlist, then compare the trade-offs."
                      : "Add one more item to unlock the board."}
                  </p>
                  <p className="mt-2 text-[13px] leading-[1.55] text-[var(--muted)]">
                    The board ranks selected items by weighted axis scores. Nothing is saved to an account; the shortlist lives in this URL.
                  </p>

                  {suggestedItems.length > 0 ? (
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      {suggestedItems.map((item) => (
                        <button
                          key={item.item.id}
                          type="button"
                          onClick={() => toggleItem(item.item.id)}
                          disabled={isAtMax}
                          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[12px] font-medium text-[var(--foreground)] shadow-sm hover:border-[var(--border-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="text-[var(--muted)]">+</span>
                          {item.item.name}
                          <span className="num text-[var(--muted)] tabular-nums">
                            {item.overall > 0 ? item.overall.toFixed(1) : "—"}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-6 grid grid-cols-1 gap-2 text-left sm:grid-cols-3">
                    {[
                      ["1", "Pick tools", "Choose 2-4 comparable items."],
                      ["2", "Tune axes", "Weight what matters for this decision."],
                      ["3", "Share URL", "Send the exact comparison state."],
                    ].map(([n, title, body]) => (
                      <div
                        key={n}
                        className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-3"
                      >
                        <span className="num inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--foreground)] text-[11px] font-semibold text-[var(--background)]">
                          {n}
                        </span>
                        <p className="mt-2 text-[12px] font-medium">{title}</p>
                        <p className="mt-1 text-[11px] leading-[1.45] text-[var(--muted)]">
                          {body}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="grid gap-3 overflow-x-auto"
                style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(180px, 1fr))` }}
              >
                {rows.map((row, index) => (
                  <div
                    key={row.item.id}
                    className="min-w-[180px] rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-4"
                  >
                    <div className="mb-4">
                      <p className="text-[12px] uppercase tracking-[0.08em] text-[var(--muted)]">#{index + 1}</p>
                      <div className="mt-1 flex items-start justify-between gap-3">
                        <h3 className="text-[16px] font-semibold">{row.item.name}</h3>
                        <span className="num text-2xl font-semibold">{row.total.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {row.tradeoffs.map((tradeoff) => (
                        <div key={tradeoff.aspect.id}>
                          <div className="mb-1 flex justify-between gap-2 text-[12px] text-[var(--muted)]">
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
