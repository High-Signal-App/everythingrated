import assert from "node:assert/strict";
import { compareItems, encodeCompareState, parseCompareState } from "./comparison";
import type { ItemWithAggregate } from "./ratings";

const aspect = (key: string, label = key) => ({
  id: key,
  directoryId: "dir",
  key,
  label,
  description: "",
  sortOrder: 0,
});

const item = (id: string, name: string, scores: Record<string, number>): ItemWithAggregate => ({
  item: {
    id,
    directoryId: "dir",
    slug: id,
    name,
    description: "",
    websiteUrl: "",
    logoUrl: null,
    createdAt: new Date(0),
  },
  aspects: Object.entries(scores).map(([key, avg]) => ({
    aspect: aspect(key),
    avg,
    count: 3,
    yourScore: null,
  })),
  overall: 0,
  totalRaters: 3,
});

const rows = compareItems(
  [item("a", "A", { speed: 5, polish: 2 }), item("b", "B", { speed: 2, polish: 5 })],
  ["a", "b"],
  { polish: 4, speed: 1 },
);

assert.equal(rows[0].item.id, "b");
assert.equal(rows[0].total > rows[1].total, true);

const encoded = encodeCompareState(["a", "b"], { speed: 1, polish: 2.5 });
const parsed = parseCompareState(new URLSearchParams(encoded));
assert.deepEqual(parsed.selectedIds, ["a", "b"]);
assert.equal(parsed.weights.polish, 2.5);
assert.equal(parsed.weights.speed, undefined);
