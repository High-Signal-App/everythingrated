# everythingrated — PROJECT STATUS
Last updated: 2026-06-28

## Why / What

**EverythingRated** is a multi-axis ratings platform testing whether directory-specific aspect rubrics are more useful than one collapsed score. Product thesis: an AI editor should be judged on different axes than a database or hosting provider.

**Users:** Anonymous visitors rating tools across seeded directories; moderators approving community submissions via token-gated queue.

**Constraints:** POC stays anonymous (httpOnly `er_visitor` cookie) until rating UX proves useful. Item submission pilot is `ai-dev-tools` only. Time-evolving ratings core schema shipped; UI polish (sparklines, windows) deferred.

**IN scope:** Three seeded directories, multi-axis rating UX, comparison boards, moderated submissions, D1 on Cloudflare Workers.

**OUT of scope:** Full user auth, tier-list mode, collaborative voting, search/comments, high-signal ingest, broad public submission without moderation.

## Dependencies

### External

- **Cloudflare:** Workers via OpenNext (`@opennextjs/cloudflare`); D1 binding `DB` → `everythingrated-db`; Workers rate limiter binding `RATE_LIMITER`.
- **PostHog:** analytics via local wrapper.
- **Drizzle ORM:** D1 schema in `packages/db`.
- **Env:** `.env.example` — `MODERATION_TOKEN` (moderation queue gate).

### Internal (fleet)

- **SaaS Maker:** `@saas-maker/feedback` widget integration.

### Stack & commands

**Stack:** Next.js 16 + React 19 + Tailwind v4 + Drizzle ORM + Cloudflare D1; `@opennextjs/cloudflare` on Workers; pnpm monorepo (`apps/web`, `packages/db`). PostHog analytics; Workers rate limiter binding.

| Command | Purpose |
|---------|---------|
| `pnpm install` | Workspace install |
| `cp .env.example .env.local` | Local env |
| `pnpm db:migrate:local` | Apply D1 migrations locally |
| `pnpm db:seed:local` | Seed local D1 (`scripts/seed-d1.ts`) |
| `pnpm dev` | Next.js → http://localhost:3000 |
| `pnpm build` / `pnpm cf:build` | Next build / OpenNext CF build |
| `pnpm deploy` | OpenNext build + deploy to Workers |
| `pnpm db:migrate:remote` / `db:seed:remote` | Remote D1 |
| `pnpm test` | Vitest validation + comparison assertions |
| `pnpm typecheck` / `pnpm lint` | TS + recursive lint |
| `pnpm db:generate` / `db:studio` | Drizzle migrations / studio |

## Timeline

- **2026-06-13** — Item submission pilot shipped (plan 0004): `/d/ai-dev-tools/submit`, `item_submissions` D1 table, moderation approve/reject.
- **2026-06-13** — Time-evolving ratings core shipped (plan 0001): append-only `ratings` with `supersededAt`, `item_versions` table, indexes; UI polish deferred.
- **2026-05** — Directory submission shipped: `/submit-directory`, `directory_submissions` D1 table, token-gated `/moderation`.

## Products

- **Worker (Next.js/OpenNext):** https://everythingrated.sarthakagrawal927.workers.dev — worker `everythingrated`; D1 `everythingrated-db` (`0465c98f-b920-478d-a689-94c862693a7b`).
- **Monorepo packages:** `apps/web` (Next.js App Router), `packages/db` (Drizzle schema).
- **Local dev:** http://localhost:3000.
- **Seeded directories:** `ai-dev-tools`, `databases`, `hosting`.

## Features (shipped)

### App routes (`apps/web/src/app/`)

- `/` — landing grid of directories.
- `/d/[directory]` — directory page with aspect rubrics and item grid.
- `/d/[directory]/[item]` — multi-axis rating page per item.
- `/d/[directory]/random`, `/random` — random item picker.
- `/d/[directory]/submit` — item submission form (pilot: `ai-dev-tools` only).
- `/submit-directory` — directory suggestion form.
- `/moderation` — token-gated queue (`MODERATION_TOKEN` query param).
- `/my` — visitor's ratings across directories.
- `/list`, `/stack`, `/trending` — ranked/discovery views.
- `/aspects`, `/aspects/[key]` — aspect explorer.
- `/about`, `/privacy`, `/terms`, `/api-docs` — static/info pages.
- JSON/RSS feeds: `/d/[directory]/items.json`, `/d/[directory]/rss`, `/d/[directory]/[item]/item.json`, `/directories.json`.
- `sitemap.ts`, `robots.ts`, `manifest.ts`, `humans.txt`, `.well-known/security.txt`.

### Architecture

- Next.js App Router on Cloudflare Workers via OpenNext; D1 binding `DB` → `everythingrated-db`.
- Smart placement enabled for D1 proximity; observability 10% head sampling; 30s CPU limit.
- Anonymous ratings: httpOnly `er_visitor` cookie minted on first rating; one score per item/aspect/visitor.
- Append-only ratings with supersede on re-rate; current aggregates filter `supersededAt IS NULL`.
- Server actions in `apps/web/src/lib/` for rate, compare, submit, moderate.
- PostHog via local wrapper; rate limiter binding `RATE_LIMITER` on submit actions.
- Seed data via `scripts/seed-d1.ts` for reproducible local/remote D1.

### Seeded directories (static POC data)

- `ai-dev-tools` — AI developer tools rubric.
- `databases` — database rubric.
- `hosting` — hosting platform rubric.
- Each directory has per-directory aspect keys, labels, descriptions, and seeded items.

### Core rating UX

- Multi-axis rating UX: rate every item across directory-specific aspects.
- One score per item/aspect/visitor; re-rate supersedes prior row.
- Aggregates: average scores and counts for directory and item views.
- Directory comparison boards with tunable aspect weights.
- Multi-axis rating example above the fold; rating confidence explainer.
- Compare-two-items loop; category suggestion chips; shareable ranked-list preview.

### Time-evolving ratings (plan 0001, core shipped 2026-06-13)

- Append-only `ratings` with `supersededAt` on re-rate; history preserved.
- `item_versions` table (migration 0003) for release timeline anchoring.
- `rate()` supersedes prior row + inserts new history row.
- Auto `versionId` resolution on rate when versions seeded.
- Current-view aggregates (dir grid, item page, comparison, my, top) filter non-superseded rows.
- Indexes: `ratings_item_time_idx`, `ratings_item_aspect_time_idx`, `ratings_visitor_idx`.
- **Deferred polish:** rolling time windows, trend sparklines, `last_release` / staleness UI, seed version backfill.

### Item tags (migration 0004)

- `item_tags` table for stack recommender constraint boosts (e.g. `runs-on:cloudflare`, `pricing:free-tier`).

### Directory submission (shipped 2026-05)

- `/submit-directory` form with validation (3–8 aspects, length caps).
- `directory_submissions` D1 table; slug dedup; approve inserts `directories` + `aspects`.
- `/moderation` approve/reject with `MODERATION_TOKEN`.

### Item submission pilot (plan 0004, shipped 2026-06-13)

- `/d/ai-dev-tools/submit` — name, description ≥20 chars, https URL, optional contact.
- `item_submissions` D1 table (migration 0002); statuses: pending/approved/rejected/merged.
- Moderation section on `/moderation`: approve writes to `items`; reject/rollback with notes.
- `loadItemSubmissionFixtures()` for seed/dry-runs.
- Duplicate detection against existing items + pending queue.

### D1 schema tables (`packages/db/src/schema.ts`)

- `directories`, `items`, `aspects`, `ratings`, `item_versions`, `item_tags`.
- `directory_submissions`, `item_submissions`.

### Infra & tests

- Deployed on Cloudflare Workers + D1 (`everythingrated-db`).
- PostHog analytics; Workers rate limiter binding.
- Vitest: validation + comparison assertion tests (`pnpm test`).
- `@saas-maker/feedback` widget integration.

## Todo / Planned / Deferred / Blocked

### Planned

1. Time-evolving ratings polish — rolling windows, trend sparklines, `last_release` / staleness UI, seed version backfill (`apps/web/src/lib/ratings.ts`, item pages).
2. Expand item submission pilot beyond `ai-dev-tools` after moderation load validated (`apps/web/src/lib/item-submissions.ts`).
3. Wire `RATE_LIMITER` on all submit actions if not fully connected (`apps/web/wrangler.toml`).

### Deferred

- High-signal ingest integration (`plans/0002-signal-ingest.md`).
- Tier-list mode, collaborative list voting, full user auth.
- Search, comments, item owner claims, dynamic aspect editing.
- Item submission rollout beyond `ai-dev-tools` until moderation pilot stable.
- Accounts or broad public submission without moderation plan.
- `rating_snapshots` materialized table (plan 0001 v2 — only if item page exceeds ~50ms p95).

### Blocked

- README POC guidance still says avoid submissions — pilot exists for `ai-dev-tools` with token-gated moderation (doc drift).
- Time-evolving ratings UI (sparklines, windows) not yet visible — aggregates behave as "latest view" only.
- No Playwright e2e in CI (script exists: `test:e2e` in web package; `apps/web/e2e/mobile.spec.ts` exists but not wired to CI).
