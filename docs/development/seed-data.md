# Seed data

## Runner

`scripts/seed-d1.ts` is the single seed runner. It is wrangler-driven and
idempotent enough for re-running locally. It seeds the 3 directories, their
aspects, items, owner ratings, and (optionally) item submission fixtures.

```bash
pnpm db:seed:local     # tsx scripts/seed-d1.ts --local
pnpm db:seed:remote    # tsx scripts/seed-d1.ts --remote
```

The owner is the only seeded rater, with `visitor_id = "seed-owner"`. Scores
are first-pass author opinion — **not community consensus**. Replace with
real ratings after a few days of usage; do not treat seed scores as truth.

## Catalogue inputs

The seed reads from JSON files in `scripts/`. These are the source of the
item/aspect catalogue. Do not edit seed output directly — edit the catalogue
JSON and re-run.

| File | Role |
| --- | --- |
| `scripts/catalogue-grounded.json` | Evidence-grounded catalogue (small, curated). |
| `scripts/catalogue-overrides.json` | Manual overrides applied on top of the resolved catalogue. |
| `scripts/catalogue-removals.json` | Items/directories to remove during reconciliation. |
| `scripts/catalogue-resolution.json` | Resolved entity mappings (canonical name → directory/aspect). |
| `scripts/catalogue-signals.json` | Adoption signals used by the evidence-grounded ecosystem axis. |
| `scripts/catalogue-extra.json` | Large extra catalogue payload. |
| `scripts/catalogue-fragments/` | Per-directory/per-fragment source data. |
| `scripts/fetch-signals.mjs` | Pulls fresh adoption signals (run before regenerating `catalogue-signals.json`). |
| `scripts/merge-catalogue.ts` | Merges fragments + overrides + removals into the resolved catalogue. |

## Item submission fixtures

`loadItemSubmissionFixtures()` (in `apps/web/src/lib/item-submissions.ts`)
loads `fixtures/item-submissions-ai-dev-tools.json` for seed/dry-runs of the
moderation queue. Use it to test moderation flows without hand-creating rows.

## When to reseed

- After a schema migration that changes seed-relevant columns.
- When the catalogue JSON changes.
- When you wipe local D1 (`rm -rf apps/web/.wrangler/state/v3/d1`).

**Never** reseed remote (`pnpm db:seed:remote`) casually — it writes owner
ratings and catalogue rows to production. Treat remote seed as a deliberate,
coordinated action.
