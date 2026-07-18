# Directories

A **directory** is a self-contained collection of rateable things with its own
aspect rubric. Directories are first-class: the schema, routes, feeds, and
aggregations are all directory-scoped.

## Model

- Each directory has a `slug`, `name`, `description`, `heroCopy`, and
  `sortOrder`.
- **Aspects are per-directory.** `(directory_id, key)` is unique, so a
  database's axes (performance, reliability, ops, cost, dx, ecosystem) differ
  from an AI tool's (maintenance, community, license, API stability,
  footprint, AI portability). This is the whole point of the product.
- **Items are per-directory.** `(directory_id, slug)` is unique, so two
  directories can each have an item called `cursor` without collision.
- Ratings are scoped per `(item_id, aspect_id, visitor_id)`.

See [architecture/data-model.md](../architecture/data-model.md) for the full
table layout.

## Focus vs parked

`apps/web/src/lib/directory-focus.ts` codifies the focus:

- `FOCUS_DIRECTORY_SLUG = "ai-dev-tools"` is the only directory surfaced in
  primary navigation, homepage, sitemap, and cross-directory suggestion chips.
- Every other slug is "parked": `isParkedDirectory(slug)` returns true.
- Parked directories' routes (`/d/[directory]`, `/d/[directory]/[item]`,
  feeds, JSON) still render for direct links. No data is removed.

Rationale and date: see
[ADR-0002](../architecture/decisions/ADR-0002-narrow-to-ai-dev-tools.md).

## Adding a directory

Directories are added through schema + seed changes so local and remote D1
stay reproducible — not through runtime creation (which would need auth and
spam mitigation). The community path is `/submit-directory` → moderation
queue → owner approve writes a `directories` + `aspects` row set. See
[submission-moderation.md](submission-moderation.md).

## Seeded directories

| Slug | Status | Notes |
| --- | --- | --- |
| `ai-dev-tools` | focus | Primary product surface. |
| `databases` | parked | Routes work; hidden from nav. |
| `hosting` | parked | Routes work; hidden from nav. |

Seed data lives in `scripts/seed-d1.ts` and the `scripts/catalogue-*.json`
files; see [development/seed-data.md](../development/seed-data.md).
