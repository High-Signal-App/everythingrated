# Data model

The schema lives in [`packages/db/src/schema.ts`](../../packages/db/src/schema.ts).
That file is authoritative for column names and types; this page describes
*why* the model is shaped this way and the non-obvious constraints. Do not
copy column lists here — read the schema.

## Tables

| Table | Purpose |
| --- | --- |
| `directories` | A self-contained collection of rateable things with its own aspect rubric. |
| `items` | A rateable thing inside a directory. |
| `aspects` | A rating axis scoped to one directory. |
| `ratings` | One score by one visitor on one aspect of one item. Append-only history with `supersededAt`. |
| `item_versions` | Sparse release timeline per item, for anchoring ratings to versions. |
| `item_tags` | Sparse key/value constraint tags for the stack recommender. |
| `directory_submissions` | Community directory suggestions awaiting moderation. |
| `item_submissions` | Community item suggestions (pilot: `ai-dev-tools`) awaiting moderation. |

## Non-obvious constraints

- **Per-directory uniqueness, not global.** `items.directoryId + slug` is
  unique; `aspects.directoryId + key` is unique. Two directories can each
  have an item or aspect with the same name. This is the product's core
  premise — see [product/directories.md](../product/directories.md).
- **Ratings are append-only.** There is no unique constraint on
  `(item_id, aspect_id, visitor_id)` anymore. Re-rating inserts a new row
  and sets `supersededAt` on the prior row. See
  [ratings-pipeline.md](ratings-pipeline.md) and
  [ADR for plan 0001](decisions/README.md#plan-0001--time-evolving-ratings).
- **`item_versions` is sparse.** Items with no rows fall back to date-only
  rating anchoring. Only fill major versions you want to anchor against.
- **`item_tags` is sparse.** Absence of a tag row means "no constraint", not
  "false". Unique per `(item, key, value)` so re-seeding is idempotent.
- **`item_submissions` slug uniqueness is app-layer partial.** The index
  `item_submissions_dir_slug_active_idx` is unique on `(directoryId, slug)`,
  but the *active* (pending/approved) scope is enforced in app logic, not at
  the DB level — rejected/merged rows keep their slugs for audit.

## Indexes that matter

- `ratings_item_time_idx` — hot path: aggregate one item's ratings within a
  time window.
- `ratings_item_aspect_time_idx` — per-aspect window aggregations.
- `ratings_visitor_idx` — find a visitor's current (non-superseded) row for
  "your score".
- `ratings_superseded_idx` on `(itemId, aspectId, supersededAt)` — backs the
  `WHERE inArray(itemId, ...) AND isNull(supersededAt)` queries that power
  all current-view aggregates.
- `item_versions_item_released_idx` — auto version resolution by
  `releasedAt <= now`.

## Migrations

Drizzle generates SQL into `packages/db/migrations/`. Wrangler applies them.
Migrations are **forward-only** — D1 has no transactional rollback. See
[operations/runbooks/d1-migrations.md](../operations/runbooks/d1-migrations.md)
for the day-to-day and rollback procedures.

## Drizzle D1 driver

`packages/db/drizzle.config.ts` uses `dialect: sqlite, driver: d1-http` —
Drizzle's D1 HTTP driver, not local SQLite. `packages/db/src/client.ts`
exposes `createDb(d1)` → `drizzle(d1, { schema })`. `getDb()` in
`apps/web/src/lib/db.ts` pulls the live D1 binding from the request context.
