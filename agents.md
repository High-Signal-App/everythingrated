# agents.md — EverythingRated

<!-- Concise agent bootloader. Deep detail lives in docs/. This file is the
     bootloader, not the spec. Edit docs/ first, then keep this in sync. -->
<!-- AGENTS.md spec: https://github.com/agentsmd/agents.md — supported by
     Claude Code, Cursor, Copilot, Gemini CLI, and others. -->

## Shared Fleet Standard

Also read and follow the shared fleet-level agent standard at `../AGENTS.md`.
Treat this repository as owned product code: protect production stability,
keep changes scoped, verify work, and record durable follow-up tasks when
something remains incomplete or blocked.

## What EverythingRated is

Multi-axis ratings platform narrowed to **one use case: AI dev-tool adoption
decisions**. Each directory defines its own aspect rubric; visitors rate
items across those aspects instead of giving one collapsed score. Anonymous
(httpOnly `er_visitor` cookie), no auth. Live: <https://ratings.highsignal.app>.

Current phase: **finish-and-pause** (closed 2026-07-10). `ai-dev-tools` is the
retained surface; `databases` and `hosting` are parked (routes still work).
See [`STATUS.md`](./STATUS.md) and [`PROJECT_STATUS.md`](./PROJECT_STATUS.md).

## Stack

Next.js 16 (App Router) · React 19 · Tailwind v4 · Drizzle ORM · Cloudflare D1
(`everythingrated-db`) · `@opennextjs/cloudflare` on Workers · pnpm workspaces.
No auth. PostHog analytics. Workers `RATE_LIMITER` binding.

## Critical constraints (read first)

- **No auth in the POC.** Ratings are anonymous, scoped by an httpOnly
  `er_visitor` cookie minted **lazily on the first `submitRating` Server
  Action, never on reads.** Do NOT add middleware that mints cookies on read
  pages — it re-pollutes the visitor space and breaks caching. See
  [`docs/architecture/decisions/ADR-0001-no-auth-in-poc.md`](./docs/architecture/decisions/ADR-0001-no-auth-in-poc.md).
- **DO NOT ADD** without a plan: auth, search, item submission beyond the
  `ai-dev-tools` pilot, comments, admin panel beyond `/moderation`, email,
  dynamic directory creation, broad public submission without moderation,
  high-signal external ingest. See
  [`docs/product/overview.md`](./docs/product/overview.md) and
  [`docs/knowledge/failed-approaches.md`](./docs/knowledge/failed-approaches.md).
- **`apps/web/agent-edge.mjs` is generated** by the fleet `apply-agent-surfaces`
  tool. Do not hand-edit; regenerate. The `apps/web/public/` copies are static
  fallbacks. See
  [`docs/architecture/edge-and-agent-surfaces.md`](./docs/architecture/edge-and-agent-surfaces.md).
- **D1 migrations are forward-only** (no transactional rollback). Always
  `wrangler d1 export` before a destructive remote migration. See
  [`docs/operations/runbooks/d1-migrations.md`](./docs/operations/runbooks/d1-migrations.md).
- **Never reseed remote casually** — `pnpm db:seed:remote` writes owner
  ratings + catalogue rows to production. It is a deliberate, coordinated
  action. See [`docs/development/seed-data.md`](./docs/development/seed-data.md).
- **Do not remove `[placement] mode = "smart"`** in `apps/web/wrangler.toml` —
  psi-swarm flagged TTFB > 1s before it. See
  [`docs/architecture/overview.md`](./docs/architecture/overview.md).
- **Never commit secrets.** Real values live in Cloudflare env bindings /
  `.env.local` (gitignored). The `.husky/pre-push` hook scans for tokens.

## Key commands

```bash
pnpm install
cp .env.example .env.local
pnpm db:migrate:local        # apply migrations to local D1 (.wrangler/)
pnpm db:seed:local           # seed local D1 (3 directories + owner ratings)
pnpm dev                     # http://localhost:3000

pnpm test                    # vitest validation + comparison assertions
pnpm typecheck               # tsc --noEmit across workspaces
pnpm check                   # biome check (format + lint)
pnpm docs:check              # validate internal Markdown links (no install)

# remote (deliberate, coordinated)
pnpm db:migrate:remote
pnpm deploy                  # opennextjs-cloudflare build && deploy (manual)
```

Full command index: [`docs/development/commands.md`](./docs/development/commands.md).

## Documentation navigation

The committed Markdown under `docs/` is the source of truth. Blume
(`blume.config.ts`) is only the presentation/search layer. Start at
[`docs/index.md`](./docs/index.md) for the full map.

| Area | Canonical doc |
| --- | --- |
| Current state (objective, blockers, next steps) | [`STATUS.md`](./STATUS.md) |
| Full durable history + shipped features | [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) |
| Product (bet, scope, what not to build) | [`docs/product/overview.md`](./docs/product/overview.md) |
| Architecture overview | [`docs/architecture/overview.md`](./docs/architecture/overview.md) |
| Data model + non-obvious constraints | [`docs/architecture/data-model.md`](./docs/architecture/data-model.md) |
| Ratings pipeline (write/read, supersede) | [`docs/architecture/ratings-pipeline.md`](./docs/architecture/ratings-pipeline.md) |
| Worker entry, edge cache, agent surfaces | [`docs/architecture/edge-and-agent-surfaces.md`](./docs/architecture/edge-and-agent-surfaces.md) |
| Architecture decisions (ADRs) + plan index | [`docs/architecture/decisions/`](./docs/architecture/decisions/) |
| Local dev setup | [`docs/development/setup.md`](./docs/development/setup.md) |
| Code conventions | [`docs/development/conventions.md`](./docs/development/conventions.md) |
| Testing | [`docs/development/testing.md`](./docs/development/testing.md) |
| Deploy | [`docs/operations/deploy.md`](./docs/operations/deploy.md) |
| Jobs (CI + scheduled) | [`docs/operations/jobs.md`](./docs/operations/jobs.md) |
| D1 migration runbook | [`docs/operations/runbooks/d1-migrations.md`](./docs/operations/runbooks/d1-migrations.md) |
| Building the docs site (Blume) | [`docs/operations/build-docs.md`](./docs/operations/build-docs.md) |
| Failed / deferred approaches (do not retry) | [`docs/knowledge/failed-approaches.md`](./docs/knowledge/failed-approaches.md) |
| Glossary | [`docs/knowledge/glossary.md`](./docs/knowledge/glossary.md) |
| Learnings queue | [`docs/knowledge/learnings.md`](./docs/knowledge/learnings.md) |

## Documentation maintenance rules

1. Markdown in `docs/` is the source of truth. Fix facts there first, then
   update code comments or this file.
2. One fact, one home. Do not re-explain what has a canonical page — link.
3. Do not duplicate what code already says (columns, route lists, script
   names). Describe *why* and *how it fits together*; link to the code.
4. Mark unresolved questions with `TBD` or an "Open questions" section. Do
   not invent rationale.
5. Keep pages short (150–300 lines). Split when a page grows past that.
6. Supersede a doc by moving it to `docs/archive/` (preserves git rename
   history), not by deleting.
7. After editing docs, run `pnpm docs:check` (enforced in
   `.github/workflows/docs.yml`).

## Repo structure (one screen)

```
apps/web/              Next.js app + Cloudflare Worker bundle (worker.mjs, agent-edge.mjs)
  src/app/             landing, directory, item routes, feeds, sitemap/robots
  src/components/      atoms / molecules / organisms (atomic design)
  src/lib/             db, ratings, actions, visitor, moderation, comparison, stack-recommender
packages/db/           Drizzle schema + D1 client + migrations
scripts/               seed-d1.ts, catalogue JSON, validate-docs.sh, build-docs.sh
docs/                  canonical documentation (source of truth)
plans/                 long-form design documents (0001–0004)
fixtures/              item submission fixtures
```

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
