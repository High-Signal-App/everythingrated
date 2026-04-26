# agents.md — EverythingRated

## Purpose
Multi-axis ratings platform. Every "thing" is rated across multiple aspects
(speed, accuracy, cost, ergonomics, integration depth) instead of a single
star. POC is seeded with ~10 AI dev tools — enough to prove the multi-axis
UX feels right and the data model holds.

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
    page.tsx                        # Landing — hero + tool grid
    [slug]/
      page.tsx                      # Item page — interactive rating UI
      actions.ts                    # Server Action: submitRating (upsert)
    globals.css                     # Tailwind v4 + design tokens
  src/components/                   # Atomic design
    atoms/      badge, card, score-bar
    molecules/  aspect-row, rate-row
    organisms/  site-header, site-footer, item-card
  src/lib/
    cn.ts                           # clsx + tailwind-merge
    visitor.ts                      # cookie read/ensure (er_visitor)
    ratings.ts                      # all DB queries + aggregation
    db.ts                           # getDb() — wraps D1 binding from request ctx
  next.config.ts                    # initOpenNextCloudflareForDev() so `next dev` sees D1
  open-next.config.ts
  wrangler.toml                     # D1 binding (DB), assets, worker entry
  cloudflare-env.d.ts               # augments CloudflareEnv with DB
packages/
  db/                               # Drizzle schema + D1 client
    src/
      schema.ts                     # items, aspects, ratings
      client.ts                     # createDb(d1) → drizzle(d1, { schema })
      index.ts                      # re-exports
    migrations/                     # drizzle-kit generate output (D1 SQL)
    drizzle.config.ts               # dialect: sqlite, driver: d1-http
scripts/
  seed-d1.ts                        # wrangler-driven seed — 10 tools + 5 aspects
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
- **Three tables**: `items`, `aspects`, `ratings`. The unique index
  `(item_id, aspect_id, visitor_id)` enforces "one rating per axis per
  visitor"; `submitRating` upserts on it so re-rating just updates.
- **Aggregation lives in `lib/ratings.ts`**: `listItemsWithAggregates` does
  one full pull and reduces in JS — fine at POC scale, swap for SQL avg
  groupings if the table grows.
- **Cookie**: `er_visitor` is httpOnly + SameSite=Lax + 1 year. Minted lazily
  on the first `submitRating` call (Server Action), never on read pages, so
  bots don't pollute the visitor space.
- **Optimistic UI**: `RateRow` updates the displayed average + your-score
  immediately, then awaits the Server Action; `revalidatePath` refreshes the
  authoritative view.
- **No middleware**: visitor ids are only minted in mutating Server Actions
  to keep page renders cacheable and bot-noise-free.
- **DO NOT ADD** in POC: auth, search, item submission, categories,
  comments, admin panel, email. The whole bet is multi-axis UX.

## Divergence from the truehire template
- No `packages/core` (no domain logic worth extracting yet).
- No `packages/ui`, `packages/config` (truehire's are empty too — not used).
- No NextAuth, no GitHub adapter tables.
- No husky / secret-scan yet — add when first secret lands.
- ESLint + tsconfig use upstream `eslint-config-next` directly instead of
  `@saas-maker/*` shared configs (those configs aren't in this repo, and the
  POC shouldn't depend on uncommitted external packages).

## Active context
POC. Owner is the only seeded rater (`visitor_id = "seed-owner"`). Scores
above are first-pass author opinion — replace with real ratings after a
few days of usage.
