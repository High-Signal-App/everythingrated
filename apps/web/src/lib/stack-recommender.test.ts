import assert from "node:assert/strict";

import { test } from 'vitest';

import { type Catalogue, type CatalogueItem,recommendStack, TAG_BOOST } from "./stack-recommender";
import type { ConstraintTag, StackIntent } from "./stack-vocabulary";

test('stack-recommender', () => {
  const mkItem = (
    slug: string,
    dir: string,
    dirName: string,
    scores: Record<string, number>,
    tags: ConstraintTag[] = [],
    totalRaters = 3,
  ): CatalogueItem => ({
    id: slug,
    slug,
    name: slug,
    description: "",
    websiteUrl: "",
    logoUrl: null,
    directorySlug: dir,
    directoryName: dirName,
    aspects: Object.entries(scores).map(([key, avg]) => ({ key, label: key, avg, count: 3 })),
    totalRaters,
    tags,
  });
  
  const catalogue: Catalogue = {
    directories: [
      {
        slug: "databases",
        name: "Databases",
        items: [
          mkItem("d1", "databases", "Databases", { speed: 5, cost: 5, dx: 3 }, [{ key: "runs-on", value: "cloudflare" }]),
          mkItem("bigsql", "databases", "Databases", { speed: 5, cost: 1, dx: 5 }, []),
        ],
      },
      {
        slug: "auth-platforms",
        name: "Auth",
        items: [
          mkItem("authA", "auth-platforms", "Auth", { dx: 5, cost: 2 }),
          mkItem("authB", "auth-platforms", "Auth", { dx: 3, cost: 5 }),
        ],
      },
    ],
  };
  
  // ── Weighting changes the winner ──────────────────────────────────
  // Prioritise cost: d1 (cost 5) should beat bigsql (cost 1) in databases.
  const costIntent: StackIntent = { directories: ["databases"], weights: { cost: 3 }, tags: [] };
  const costResult = recommendStack(catalogue, costIntent);
  assert.equal(costResult.picks[0].top.item.slug, "d1", "cost priority picks d1");
  
  // Prioritise dx: bigsql (dx 5) should beat d1 (dx 3).
  const dxIntent: StackIntent = { directories: ["databases"], weights: { dx: 3 }, tags: [] };
  assert.equal(recommendStack(catalogue, dxIntent).picks[0].top.item.slug, "bigsql", "dx priority picks bigsql");
  
  // ── Constraint tag boost breaks ties / lifts a match ──────────────
  // Neutral weights but require cloudflare → d1 (tagged) wins via boost.
  const cfIntent: StackIntent = { directories: ["databases"], weights: {}, tags: [{ key: "runs-on", value: "cloudflare" }] };
  const cfResult = recommendStack(catalogue, cfIntent);
  assert.equal(cfResult.picks[0].top.item.slug, "d1", "cloudflare tag lifts d1");
  assert.equal(cfResult.picks[0].top.matchedTags.length, 1, "records matched tag");
  // base mean of d1 = (5+5+3)/3 = 4.333; boosted = *1.15
  const d1 = cfResult.picks[0].top;
  assert.ok(Math.abs(d1.score - d1.base * (1 + TAG_BOOST)) < 1e-9, "tag boost applied multiplicatively");
  
  // ── Cross-stack: one pick per requested directory, in order ───────
  const stackIntent: StackIntent = { directories: ["databases", "auth-platforms"], weights: { dx: 3 }, tags: [] };
  const stack = recommendStack(catalogue, stackIntent);
  assert.equal(stack.picks.length, 2, "one pick per directory");
  assert.deepEqual(stack.picks.map((p) => p.directorySlug), ["databases", "auth-platforms"], "preserves order");
  assert.equal(stack.picks[0].alternatives.length, 1, "surfaces alternatives");
  
  // ── Unknown directory recorded, not crashed ───────────────────────
  const unknown = recommendStack(catalogue, { directories: ["nonexistent", "databases"], weights: {}, tags: [] });
  assert.deepEqual(unknown.unknownDirectories, ["nonexistent"]);
  assert.equal(unknown.picks.length, 1, "still returns the known pick");
  
  console.log("stack-recommender.test.ts ✓");
});
