# agents.md — EverythingRated

## Shared Fleet Standard

Also read and follow the shared fleet-level agent standard at `../AGENTS.md`. Treat this repository as owned product code: protect production stability, keep changes scoped, verify work, and record durable follow-up tasks when something remains incomplete or blocked.

## Purpose
Multi-axis ratings platform. Every "thing" is rated across multiple aspects
instead of a single star. Items are organised into **directories**, each with
its own per-directory aspect set (an AI editor is rated on different axes than
a database). Seeded directories: AI dev tools, databases, hosting.

## Stack
- Framework: Next.js 16 (App Router), React 19
- Language: TypeScript
- Styling: Tailwind CSS v4
- DB: Drizzle ORM + Cloudflare D1 (`everythingrated-db`). Bound via
  `apps/web/wrangler.toml` as `DB`. Read via `getCloudflareContext().env.DB`
  inside Server Components / Server Actions.
- Runtime: `@opennextjs/cloudflare` → Cloudflare Workers (single Worker hosts
  the whole app + assets).
- Auth: NONE in POC. Ratings are anonymous, identified by an httpOnly cookie
  `er_visitor=<uuid>` set on first rating.
- Package manager: pnpm workspaces (Node ≥20)

## Repo structure
```
apps/web/                           # Next.js application
  src/app/
    layout.tsx                      # Site shell + global styles
    page.tsx                        # Landing — hero + directory grid
    d/[directory]/
      page.tsx                      # Directory landing — item grid
      [item]/page.tsx               # Item page — interactive rating UI
    globals.css                     # Tailwind v4 + design tokens
  src/components/                   # Atomic design
    atoms/      badge, card, score-bar
    molecules/  aspect-row, rate-row
    organisms/  site-header, site-footer, item-card, directory-card
  src/lib/
    cn.ts                           # clsx + tailwind-merge
    visitor.ts                      # cookie read/ensure (er_visitor)
    ratings.ts                      # all DB queries + aggregation
    actions.ts                      # Server Action: submitRating
    db.ts                           # getDb() — wraps D1 binding from request ctx
  next.config.ts                    # initOpenNextCloudflareForDev() so `next dev` sees D1
  open-next.config.ts
  wrangler.toml                     # D1 binding (DB), assets, worker entry
  cloudflare-env.d.ts               # augments CloudflareEnv with DB
packages/
  db/                               # Drizzle schema + D1 client
    src/
      schema.ts                     # directories, items, aspects, ratings
      client.ts                     # createDb(d1) → drizzle(d1, { schema })
      index.ts                      # re-exports
    migrations/                     # drizzle-kit generate output (D1 SQL)
    drizzle.config.ts               # dialect: sqlite, driver: d1-http
scripts/
  seed-d1.ts                        # wrangler-driven seed — 3 directories
```

## Key commands
```bash
pnpm install

# Local
pnpm db:migrate:local               # apply migrations to local D1 (.wrangler/)
pnpm db:seed:local                  # 10 tools + 5 aspects + owner ratings
pnpm dev                            # http://localhost:3000

# Remote
pnpm db:migrate:remote
pnpm db:seed:remote
pnpm deploy                         # opennextjs-cloudflare build && deploy

pnpm --filter web typecheck
pnpm db:generate                    # regen migrations after schema change
```

## Architecture notes
- **Four tables**: `directories`, `items`, `aspects`, `ratings`.
  - `items.directory_id` + `(directory_id, slug)` unique → slugs are scoped
    per directory.
  - `aspects.directory_id` + `(directory_id, key)` unique → aspects are
    per-directory (databases have their own axes, AI tools have theirs).
  - `(item_id, aspect_id, visitor_id)` unique on `ratings` enforces "one
    rating per axis per visitor"; `submitRating` upserts on it so re-rating
    just updates.
- **Aggregation lives in `lib/ratings.ts`**: `listItemsWithAggregates` is
  directory-scoped and does one full pull + JS reduce — fine at POC scale,
  swap for SQL avg groupings if a directory grows.
- **Cookie**: `er_visitor` is httpOnly + SameSite=Lax + 1 year. Minted lazily
  on the first `submitRating` call (Server Action), never on read pages, so
  bots don't pollute the visitor space.
- **Optimistic UI**: `RateRow` updates the displayed average + your-score
  immediately, then awaits the Server Action; `revalidatePath` refreshes the
  authoritative view.
- **No middleware**: visitor ids are only minted in mutating Server Actions
  to keep page renders cacheable and bot-noise-free.
- **DO NOT ADD** in POC: auth, search, item submission, comments, admin
  panel, email, dynamic directory creation (needs auth + spam mitigation).
  The whole bet is multi-axis UX.

## Divergence from the truehire template
- No `packages/core` (no domain logic worth extracting yet).
- No `packages/ui`, `packages/config` (truehire's are empty too — not used).
- No NextAuth, no GitHub adapter tables.
- No husky / secret-scan yet — add when first secret lands.
- ESLint + tsconfig use upstream `eslint-config-next` directly instead of
  `@saas-maker/*` shared configs (those configs aren't in this repo, and the
  POC shouldn't depend on uncommitted external packages).

<!-- FLEET-GUIDANCE:START -->

## Fleet Guidance

### Adding Tasks
- Add durable work items in SaaS Maker Cockpit Tasks when the task affects product behavior, deployment, user feedback, or fleet maintenance.
- Include the project slug, a concise title, acceptance criteria, priority/status, and links to relevant code, issues, traces, or dashboards.
- If task discovery starts locally in an editor or agent session, mirror the durable next step back into SaaS Maker before handoff.

### Using SaaS Maker
- Treat SaaS Maker as the system of record for project metadata, feedback, tasks, analytics, testimonials, changelog, and fleet visibility.
- Prefer API-first workflows through `fnd api`, the SDK, or widgets instead of one-off scripts when interacting with SaaS Maker features.
- Keep this agent file aligned with the project record when operating rules, integrations, or deployment conventions change.

### Free AI First
- Prefer free/local AI paths for routine development and analysis: the `free-ai` gateway, local models, provider free tiers, and cached context.
- Escalate to paid models only when complexity, correctness risk, or missing capability justifies the cost.
- Note any paid-AI use in the task or handoff when it materially affects cost, reproducibility, or future maintenance.

<!-- FLEET-GUIDANCE:END -->

## Active context
POC. Owner is the only seeded rater (`visitor_id = "seed-owner"`). Scores
are first-pass author opinion — replace with real ratings after a few days
of usage. 3 seeded directories (ai-dev-tools, databases, hosting); plan
0003 covers the static multi-directory shape currently in production.
