# Plan 0001 — Time-evolving ratings

**Status:** ready (next iteration after v0 POC scaffold)
**Created:** 2026-04-26
**Parallel:** see `0002-signal-ingest.md` for external signal time-bucketing.

## Problem

AI dev tools change weekly. A 4-star rating from 8 months ago describes a tool that no longer exists (Cursor 0.20 != 0.45). The v0 schema treats a rating as current state via upsert on `(item, aspect, visitor)` and aggregates all-time. The page must instead answer: "what is this tool's score *right now*, and how is it trending?" — which requires every rating to be a fact at a moment, plus rolling-window aggregation, plus a visible release-version anchor.

## Schema diff (v0 -> v1)

v0 (existing): `items`, `aspects`, `ratings(item_id, aspect_id, visitor_id, score, created_at)` with `uniqueIndex(item_id, aspect_id, visitor_id)`.

### v1 changes in `packages/db/src/schema.ts`

```ts
// 1. NEW — release timeline per item. Sparse: only fill major versions
//    we want to anchor against. Items with no rows fall back to date-only.
export const itemVersions = sqliteTable(
  "item_versions",
  {
    id: text("id").primaryKey(),
    itemId: text("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
    version: text("version").notNull(),       // "0.45", "1.0", "Sonnet 4.5"
    releasedAt: integer("released_at", { mode: "timestamp_ms" }).notNull(),
    note: text("note"),                        // optional changelog blurb
  },
  (t) => ({
    uniq: uniqueIndex("item_versions_item_version_idx").on(t.itemId, t.version),
    byDate: index("item_versions_item_released_idx").on(t.itemId, t.releasedAt),
  }),
);

// 2. CHANGED — ratings becomes append-only history.
//    DROP the unique index on (item, aspect, visitor).
//    ADD versionId (nullable; auto-derived from created_at on insert if null),
//    ADD supersededAt for "this rating was replaced by a newer one from same visitor".
export const ratings = sqliteTable(
  "ratings",
  {
    id: text("id").primaryKey(),
    itemId: text("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
    aspectId: text("aspect_id").notNull().references(() => aspects.id, { onDelete: "cascade" }),
    visitorId: text("visitor_id").notNull(),
    score: integer("score").notNull(),
    versionId: text("version_id").references(() => itemVersions.id, { onDelete: "set null" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    // Set when same visitor rates same (item, aspect) again. Old row stays
    // for history; new row is current. Aggregations filter superseded out
    // of "current view" but include them in trend lines.
    supersededAt: integer("superseded_at", { mode: "timestamp_ms" }),
  },
  (t) => ({
    // Hot path: aggregate one item's ratings within a window.
    byItemTime: index("ratings_item_time_idx").on(t.itemId, t.createdAt),
    // Hot path: per-aspect window aggregations.
    byAspectTime: index("ratings_item_aspect_time_idx").on(t.itemId, t.aspectId, t.createdAt),
    // Find a visitor's current row for an axis (for "your score" + supersede).
    byVisitor: index("ratings_visitor_idx").on(t.visitorId, t.itemId, t.aspectId),
  }),
);
```

No `rating_snapshots` materialised table in v1. Compute on read (justified below). Add it in v2 if a single item page exceeds ~50ms p95.

### Re-rating semantics

`rate()` no longer upserts. New flow:
1. `UPDATE ratings SET superseded_at = now() WHERE visitor_id = ? AND item_id = ? AND aspect_id = ? AND superseded_at IS NULL`
2. `INSERT` new row with current `created_at` and resolved `version_id`.

This preserves the trend line through one visitor's mind-changes — a 2 -> 5 reversal after a release shows up as a real signal.

### Version resolution

On insert, `versionId` is set by:
1. If the form submitted an explicit `versionId`, use it.
2. Else look up the latest `item_versions` row for `itemId` with `releasedAt <= now()`. If none, leave `versionId = NULL`.

Explicit pick is offered only when the rater toggles "I'm rating a specific version" — default UX is auto-derived to keep friction at zero.

## Aggregation strategy

### Windows

| Window | Definition | When shown |
|---|---|---|
| `last_30d` | `created_at >= now() - 30d`, exclude `superseded_at IS NOT NULL` | **default on item page** |
| `last_90d` | same, 90d | trend toggle |
| `last_release` | `version_id = (latest item_versions row)` | shown when latest version is < 60d old, else hidden |
| `all_time` | every non-superseded row | secondary, greyed-out comparison number |

Rule: **default is `last_30d` for items with >= 5 raters in last 30d, otherwise fall back to `last_90d`, then `all_time` with a "stale" badge.** This avoids the empty-state problem on cold items.

### Compute on read (no materialised table in v1)

POC scale: <10 items, <100 ratings per item per month likely. SQL `AVG(score)` with the time-range index is sub-ms. The query in `lib/ratings.ts`:

```ts
// Per (item, aspect) window — single grouped query per item page.
db.select({
  aspectId: ratings.aspectId,
  avg: sql<number>`AVG(${ratings.score})`,
  count: sql<number>`COUNT(*)`,
})
  .from(ratings)
  .where(and(
    eq(ratings.itemId, itemId),
    isNull(ratings.supersededAt),
    gte(ratings.createdAt, windowStart),
  ))
  .groupBy(ratings.aspectId);
```

For the sparkline (~12 buckets), one extra query per page using `strftime`:

```ts
// 12 weekly buckets, last 90 days.
sql`strftime('%Y-%W', ${ratings.createdAt} / 1000, 'unixepoch') as bucket`
```

Three queries total per `/[slug]` page (items, current-window agg, trend buckets) — fine.

### Index plan

Already covered above. Critical is `(item_id, aspect_id, created_at)` — every page render is bounded by it. No covering index on `score` needed at this scale.

## UI data contract

`/[slug]` page receives, per aspect:

```ts
type AspectTimeSeries = {
  aspect: Aspect;
  current: { window: "last_30d" | "last_90d" | "all_time"; avg: number; count: number };
  comparison: { allTime: number; allTimeCount: number };  // greyed-out reference
  trend: { bucket: string; avg: number; count: number }[]; // 12 weekly points, oldest -> newest
  yourScore: number | null;
  yourVersion: string | null;                              // version_id resolved to label
  staleness: "fresh" | "stale" | "empty";                  // drives the "rated v0.20" badge
};

type ItemPageData = {
  item: Item;
  versions: { id: string; version: string; releasedAt: number }[];
  defaultWindow: "last_30d" | "last_90d" | "all_time";
  aspects: AspectTimeSeries[];
  overall: { current: number; trend: { bucket: string; avg: number }[] };
};
```

The main chart consumes `aspects[].trend` (5 overlapping lines, color = aspect). Sparklines on the aspect rows use the same array.

## Decisions

| Decision | Options | Picked | Why |
|---|---|---|---|
| Time anchor on rating | (a) only `created_at`, (b) only `version_id`, (c) both | **both** | Date is always known and cheap; version is the human anchor that explains a score shift. Letting one fall back to the other keeps cold-start sane. |
| Re-rating model | (a) keep upsert, (b) append + supersede flag, (c) full event sourcing | **append + supersede** | Cheapest way to preserve trend through mind-changes without a separate events table. One extra UPDATE on re-rate is fine. |
| Snapshots | (a) materialised `rating_snapshots`, (b) compute on read | **compute on read** | POC traffic is tiny; indexed `AVG()` over <10k rows is sub-ms. Add snapshots in v2 only if a profiled query exceeds 50ms p95. |
| Default window | `all_time` / `last_30d` / `last_90d` / `last_release` | **`last_30d` w/ fallback** | Whole point of the feature is "score now". 30d is the smallest window that's not noisy for ~5+ raters/month. Falls back gracefully on cold items. |
| Old ratings | (a) decay weight, (b) hide, (c) keep + label | **keep + label "rated v0.20"** | Decay needs a tuned half-life nobody can defend at POC; hiding deletes signal. Labelling pushes the call to the reader and is honest. The default 30d window already does most of the "decay" for free by exclusion. |
| Bot/spam | (a) per-visitor rate-limit, (b) IP heuristic, (c) account-required gating | **all three, lazily** | (a) one rating per (visitor, item, aspect) per 60s in the Server Action — cheap. (b) IP -> visitor map: flag if one IP mints >5 visitors/hour, drop their ratings from aggregates (don't delete). (c) flag where account becomes required: any item with >20 ratings in 24h auto-flips to "sign-in required to rate" — this is the only place auth lands in v2. |

## Migration

`packages/db/drizzle/0001_time_evolving_ratings.sql` (Drizzle generates from schema; here is the intent):

1. `CREATE TABLE item_versions ...` + indexes.
2. `ALTER TABLE ratings ADD COLUMN version_id TEXT REFERENCES item_versions(id);`
3. `ALTER TABLE ratings ADD COLUMN superseded_at INTEGER;`
4. `DROP INDEX ratings_item_aspect_visitor_idx;` (the old unique).
5. `CREATE INDEX ratings_item_time_idx ...; CREATE INDEX ratings_item_aspect_time_idx ...; CREATE INDEX ratings_visitor_idx ...;`
6. **Backfill versions** for the 10 seeded tools via an idempotent block in `seed.ts` (dates from public changelogs — Cursor 0.45, Claude Code 1.0, etc.). Failure to backfill is non-fatal: `version_id` stays NULL, date-only mode kicks in.
7. **Backfill ratings.version_id** with one UPDATE per item joining on the latest `item_versions` row at-or-before `ratings.created_at`. Single SQL pass:
   ```sql
   UPDATE ratings SET version_id = (
     SELECT iv.id FROM item_versions iv
     WHERE iv.item_id = ratings.item_id AND iv.released_at <= ratings.created_at
     ORDER BY iv.released_at DESC LIMIT 1
   );
   ```
8. `lib/ratings.ts` swap: replace `rate()` upsert with supersede-then-insert; replace `buildAggregate` JS reduce with the SQL grouped query above; add `getItemTimeSeries(slug)` returning the `ItemPageData` shape.
9. `apps/web/src/app/[slug]/page.tsx` reads new shape; add a `<TrendChart>` organism (Recharts or a 80-line SVG sparkline — prefer the latter at POC).

Cookie identity is unchanged — the `er_visitor` story carries through.

## Open questions

1. **Version-rating UX surfacing** — auto-derive only, or always show "you're rating v0.45" with an opt-out toggle to rate "the tool overall"? Default plan auto-derives silently; a pill above the rate-row showing the resolved version is the cheapest middle ground.
2. **Sparkline bucket size** — weekly (12 buckets / 90d) or daily (30 buckets / 30d)? Daily is noisier on low-volume items. Plan picks weekly; revisit once we see real distribution.
3. **External signals (Reddit, Twitter, GH issues) bucketing** — owned by `0002-signal-ingest.md`. They share the same time grid; this plan only commits to the `bucket: string` shape so both sources can be overlaid on the same chart later.
