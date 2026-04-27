# 0003 — Directories (static multi-directory)

**Status:** shipped 2026-04-27.

## Why
POC was a single hardcoded "AI dev tools" list. Multi-axis ratings make sense
across many domains (databases, hosting, etc.) — directories let the platform
host more than one without code changes per category.

## Scope (this iteration)
- **Static**: directories, items, and aspects defined in seed data. No UI to
  create directories at runtime.
- **No backward compatibility**: old `/[slug]` route + single-category schema
  dropped. Fresh DB, fresh URLs.

## Schema
- New `directories` table (slug, name, description, hero_copy, sort_order).
- `items.directoryId` FK → directories. `items.slug` unique per
  directory (`(directory_id, slug)`).
- `aspects.directoryId` FK → directories. `aspects.key` unique per
  directory (`(directory_id, key)`). Aspects are per-directory, not global —
  databases get their own latency/durability/cost/dx/ecosystem axes, not the
  AI-tool axes.
- `ratings` unchanged — visitor-scoped uniq on `(item_id, aspect_id, visitor_id)`.
- Old `items.category` column removed.

## Routes
- `/` → directory grid (`DirectoryCard` per directory).
- `/d/[directory]` → item grid for that directory.
- `/d/[directory]/[item]` → item detail + rating UI.
- Old `/[slug]` deleted.

## Lib
- `listDirectories()` — all directories with item + aspect counts.
- `getDirectoryBySlug(slug)` — single directory.
- `listItemsWithAggregates(directoryId, visitorId)` — directory-scoped.
- `getItemAggregate(directorySlug, itemSlug, visitorId)` — returns
  `{ directory, data }`.
- `submitRating` action moved to `lib/actions.ts`; revalidates new paths.

## Seed
3 directories: `ai-dev-tools` (10), `databases` (5), `hosting` (5). Each
with 5 aspects scoped to its domain. Owner-seeded ratings.

## Migrations
Old `0000_nervous_human_robot.sql` deleted; replaced with fresh
`0000_tiny_silverclaw.sql` covering all four tables. Local D1 wiped before
re-applying. **Remote D1 must be wiped manually** before deploying — drop
old `items`, `aspects`, `ratings`, `_cf_KV` and re-run migrations.

## Out of scope (next plans)
- Dynamic directory maker (UI to create directory + define aspects). Needs
  auth + spam mitigation.
- Search across directories.
- Item submission flow.
