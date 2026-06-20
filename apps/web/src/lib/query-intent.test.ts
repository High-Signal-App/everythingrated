import { test } from 'vitest';
import assert from "node:assert/strict";
import { interpretQuery, mergeIntent, weightsForAspectGroups, EMPHASIS_WEIGHT } from "./query-intent";

test('query-intent', () => {
  // ── Directory detection ───────────────────────────────────────────
  const chat = interpretQuery(
    "I'm building a realtime chat app on Cloudflare Workers, need a fast database and auth, on a budget",
  );
  assert.ok(chat.directories.includes("databases"), "detects databases");
  assert.ok(chat.directories.includes("auth-platforms"), "detects auth");
  
  // "cloudflare workers" → runs-on:cloudflare tag
  assert.ok(
    chat.tags.some((t) => t.key === "runs-on" && t.value === "cloudflare"),
    "detects cloudflare constraint",
  );
  // "realtime" → realtime tag
  assert.ok(chat.tags.some((t) => t.key === "realtime"), "detects realtime constraint");
  // "budget" → free-tier tag
  assert.ok(chat.tags.some((t) => t.key === "pricing" && t.value === "free-tier"), "detects budget");
  
  // "fast" → speed emphasis weights present
  assert.ok((chat.weights.speed ?? 1) >= EMPHASIS_WEIGHT, "fast emphasises speed");
  // "budget" constraint also boosts cost aspect
  assert.ok((chat.weights.cost ?? 1) >= EMPHASIS_WEIGHT, "budget emphasises cost");
  
  // ── Word-boundary safety: 'go' must not match 'google' ────────────
  const noGo = interpretQuery("I use google analytics");
  assert.ok(
    !noGo.tags.some((t) => t.value === "go"),
    "'google' must not trigger the go language tag",
  );
  assert.ok(noGo.directories.includes("analytics"), "still detects analytics");
  
  // ── Empty / noise input ───────────────────────────────────────────
  const empty = interpretQuery("");
  assert.deepEqual(empty, { directories: [], weights: {}, tags: [] });
  const noise = interpretQuery("hello there friend");
  assert.equal(noise.directories.length, 0, "no spurious directories");
  
  // ── TypeScript detection ──────────────────────────────────────────
  const ts = interpretQuery("a typescript orm with great type safety");
  assert.ok(ts.directories.includes("orms"), "detects orm");
  assert.ok(ts.tags.some((t) => t.key === "language" && t.value === "typescript"), "detects typescript");
  assert.ok((ts.weights.type_safety ?? 1) >= EMPHASIS_WEIGHT, "type safety emphasised");
  
  // ── mergeIntent: explicit overrides win, omitted fall through ─────
  const merged = mergeIntent(chat, { directories: ["hosting"] });
  assert.deepEqual(merged.directories, ["hosting"], "override replaces directories");
  assert.equal(merged.tags, chat.tags, "omitted field falls through");
  
  // ── weightsForAspectGroups ────────────────────────────────────────
  const w = weightsForAspectGroups(["speed", "cost"]);
  assert.equal(w.speed, EMPHASIS_WEIGHT);
  assert.equal(w.cost, EMPHASIS_WEIGHT);
  assert.equal(w.nonexistent, undefined);
  
  console.log("query-intent.test.ts ✓");
});
