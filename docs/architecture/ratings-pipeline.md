# Ratings pipeline

All rating queries and aggregations live in
[`apps/web/src/lib/ratings.ts`](../../apps/web/src/lib/ratings.ts). That file
is authoritative for the exact queries; this page describes the design and
the non-obvious parts.

## Write path: `rate()`

1. `submitRating` Server Action (`apps/web/src/lib/actions.ts`) receives
   `(directorySlug, itemSlug, aspectKey, score)`.
2. It calls `ensureVisitorId()` to mint or read the `er_visitor` cookie.
3. `rate()` resolves the item + aspect, then:
   - **Supersedes** the visitor's prior current row for that
     `(item, aspect, visitor)` by setting `supersededAt = now` (if one
     exists).
   - **Inserts** a new `ratings` row with the new score.
   - **Auto-anchors `versionId`** if `item_versions` rows exist: picks the
     latest version with `releasedAt <= now`. If no versions are seeded,
     `versionId` stays null and the rating is date-only.
4. `revalidatePath` refreshes the authoritative view; the optimistic UI
   already showed the new score.

## Read path: current-view aggregates

Every aggregate (directory grid, item page, comparison, `/my`, `/list`,
`/trending`, `/top`) filters `supersededAt IS NULL`. The
`ratings_superseded_idx` index backs these queries.

`listItemsWithAggregates(directoryId, visitorId)` is directory-scoped and
does **one full pull + JS reduce**. This is fine at POC scale. If a directory
grows, swap it for SQL `AVG` / `GROUP BY` against the superseded index — the
schema already supports it.

## Existence checks

`countVisitorRatings` uses `limit(1)` instead of `COUNT(*)` to avoid scanning
the full rating history when only an existence check is needed (e.g. "has this
visitor rated anything?"). Keep this pattern for existence probes.

## Time-evolving ratings (plan 0001)

**Shipped (core):** append-only `ratings` with `supersededAt`, `item_versions`
table, `versionId` / `supersededAt` columns, indexes, auto version
resolution. Current aggregates behave as a "latest view".

**Deferred polish** (do not implement without revisiting):

- Rolling time windows (30d / 90d).
- Trend sparklines on item pages.
- `last_release` / staleness UI.
- Seed version backfill for existing ratings.
- `rating_snapshots` materialized table (only if item page exceeds ~50ms p95).

See [decisions/README.md](decisions/README.md#plan-0001--time-evolving-ratings)
and `plans/0001-time-evolving-ratings.md`.

## Comparison boards

`apps/web/src/lib/comparison.ts` weights each aspect's per-item score by a
user-tunable 0–5 multiplier (`?w=key:value,...`), then divides by total
weight to keep totals on the original 0–10 scale. Weights default to 1; the
URL encoding drops any weight equal to 1 to keep shareable URLs short. Sort
tie-breaks alphabetically on `item.name`.

## Stack recommender

`apps/web/src/lib/stack-recommender.ts` + `stack-vocabulary.ts` let a visitor
describe their project constraints and get a rated stack. `item_tags` (sparse
key/value) provide constraint boosts — e.g. `runs-on:cloudflare`,
`pricing:free-tier`, `self-hostable:yes`. Items without a tag simply don't
get a boost; absence is not "false". See
[data-model.md](data-model.md#item_tags).
