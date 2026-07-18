# Architecture overview

## Shape

EverythingRated is a single Cloudflare Worker hosting the entire Next.js app
plus its static assets, backed by one Cloudflare D1 database.

```
            ┌────────────────────────────────────────────┐
            │  Cloudflare Worker  (everythingrated)      │
            │  apps/web/worker.mjs  ←  entry             │
            │   ├─ withTiming middleware (Server-Timing) │
            │   ├─ handleAgentEdge (agent surfaces)      │
            │   └─ OpenNext fetch → Next.js App Router   │
            │        ├─ Server Components (read D1)      │
            │        ├─ Server Actions (write D1)        │
            │        └─ Route Handlers (feeds, JSON)     │
            └───────────────┬────────────────────────────┘
                            │ DB binding (D1)
                  ┌─────────▼──────────┐
                  │  D1: everythingrated-db  │
                  │  packages/db schema      │
                  └──────────────────────────┘
```

## Stack

- **Framework:** Next.js 16 (App Router), React 19.
- **Runtime:** `@opennextjs/cloudflare` → Cloudflare Workers.
  `apps/web/next.config.ts` calls `initOpenNextCloudflareForDev()` so
  `next dev` sees the D1 binding from `wrangler.toml`.
- **DB:** Drizzle ORM + Cloudflare D1 (`everythingrated-db`), bound as `DB`
  in `apps/web/wrangler.toml`. Read via `getCloudflareContext().env.DB`
  inside Server Components / Server Actions.
- **Styling:** Tailwind CSS v4.
- **Package manager:** pnpm workspaces (`apps/web`, `packages/db`), Node ≥20.
- **Auth:** none. Anonymous ratings scoped by `er_visitor` cookie.
- **Analytics:** PostHog via a local wrapper.
- **Rate limiting:** Workers `RATE_LIMITER` binding (not yet wired to all
  submit endpoints).

## Request flow

1. Worker receives request in `apps/web/worker.mjs`.
2. `handleAgentEdge` (from `agent-edge.mjs`) short-circuits agent surface
   requests (`/llms.txt`, `/llms-full.txt`, `/api/ai`, `/index.md`, etc.).
   See [edge-and-agent-surfaces.md](edge-and-agent-surfaces.md).
3. `withTiming` measures duration, sets `Server-Timing`, logs slow (>200ms)
   requests.
4. OpenNext dispatches to Next.js App Router.
5. Server Components read D1 through `getDb()` (`apps/web/src/lib/db.ts`).
6. Mutations go through Server Actions in `apps/web/src/lib/actions.ts`,
   which mint/extend the visitor cookie and call `revalidatePath`.

## Why no middleware

Visitor ids are minted **only** in mutating Server Actions, never on read
pages. This keeps page renders cacheable and bot-noise-free. Adding middleware
that mints cookies on reads would re-pollute the visitor space and break
caching — do not do it without revisiting the trade-off.

## Worker config highlights (`apps/web/wrangler.toml`)

- `main = "worker.mjs"`, `compatibility_flags = ["nodejs_compat"]`.
- `[placement] mode = "smart"` — runs the Worker near the D1 datacentre so
  request → D1 round-trips don't traverse the globe (psi-swarm flagged
  TTFB > 1s before this).
- `[observability] enabled = true, head_sampling_rate = 0.1`.
- `[limits] cpu_ms = 30000`.
- `[[d1_databases]]` binding `DB` → `everythingrated-db`, migrations in
  `../../packages/db/migrations`.

## Component layout

`apps/web/src/components/` follows atomic design:

- `atoms/` — badge, card, score-bar.
- `molecules/` — aspect-row, rate-row.
- `organisms/` — site-header, site-footer, item-card, directory-card.

Plus `posthog-provider.tsx`, `saasmaker-feedback.tsx`, `VitalsReporter.tsx`.

## Deep dives

- [data-model.md](data-model.md) — tables, indexes, constraints.
- [ratings-pipeline.md](ratings-pipeline.md) — aggregation and time-evolution.
- [edge-and-agent-surfaces.md](edge-and-agent-surfaces.md) — worker entry,
  agent indexing, sitemap, feeds.
- [decisions/](decisions/) — ADRs and pointer index to `plans/`.
