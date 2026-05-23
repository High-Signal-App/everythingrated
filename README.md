# EverythingRated

Multi-axis ratings platform. Instead of collapsing a tool, product, or service
into one score, each directory defines the aspects that matter for that kind of
thing and collects per-aspect ratings.

Live app: <https://everythingrated.sarthakagrawal927.workers.dev>

Current POC directories:

- AI developer tools
- Databases
- Hosting platforms

## Product Bet

Most rating apps ask for one number and lose the actual decision context.
EverythingRated is testing whether a directory-specific rubric is more useful:
an AI editor should be judged on different axes than a database or hosting
provider. The first version is anonymous and intentionally narrow so the
multi-axis UX can be tested before adding accounts, submissions, or moderation.

## What It Does

- Shows directory pages with seeded items and aspect rubrics.
- Lets visitors rate every item across the directory's own axes.
- Stores one score per item/aspect/visitor and updates it on re-rating.
- Aggregates average scores and counts for directory and item views.
- Uses an httpOnly visitor cookie instead of auth in the POC.
- Runs on Cloudflare Workers with D1 as the backing store.

## Deployment & External Services

| Concern | Service |
|---------|---------|
| Hosting | Cloudflare Workers (`everythingrated`, everythingrated.sarthakagrawal927.workers.dev) via `@opennextjs/cloudflare` (`apps/web`) |
| Database | Cloudflare D1 (`everythingrated-db`) — Drizzle ORM |
| Auth | None — ratings are anonymous, scoped to an httpOnly `er_visitor` cookie |
| Rate limiting | Cloudflare Workers rate limiter binding (`RATE_LIMITER`) |
| Analytics | PostHog (`@saas-maker/posthog-client`) |
| CI/CD | GitHub Actions — auto-deploy to Cloudflare Workers on push to `main` |

## Local Development

```bash
pnpm install
cp .env.example .env.local
pnpm db:migrate:local
pnpm db:seed:local
pnpm dev           # http://localhost:3000
```

Open `/` for the grid; click a tool for the multi-axis rating page.

## Deploy

```bash
pnpm db:migrate:remote
pnpm db:seed:remote
pnpm deploy        # opennextjs-cloudflare build && deploy
```

## Stack

Next.js 16 · React 19 · Tailwind v4 · Drizzle ORM · Cloudflare D1 ·
`@opennextjs/cloudflare` on Workers · pnpm monorepo. No auth — ratings are
anonymous, scoped to an httpOnly `er_visitor` cookie minted on first rating.

## Repository Layout

```text
apps/web/                 Next.js app and Cloudflare Worker bundle
apps/web/src/app/         landing, directory, and item routes
apps/web/src/components/  rating UI, cards, score bars, shell
apps/web/src/lib/         D1 access, visitor cookies, rating queries/actions
packages/db/              Drizzle schema, D1 client, migrations
scripts/seed-d1.ts        local/remote seed runner
docs/migrations.md        D1 migration and rollback runbook
```

## Commands

```bash
pnpm test            # validation + comparison assertions (tsx)
pnpm typecheck       # tsc --noEmit across workspaces
pnpm lint            # recursive lint
pnpm db:generate     # regenerate Drizzle migrations after schema change
pnpm db:studio       # browse local D1 via drizzle-kit
```

## Operating Notes

- Keep the POC anonymous until the rating UX proves useful.
- Avoid comments, item submissions, admin panels, or dynamic directory creation without a moderation plan.
- Add new directories through schema/seed changes so local and remote D1 stay reproducible.
- Use `docs/migrations.md` for D1 migration and rollback steps.
- If a directory grows, move aggregation out of JS reduction and into SQL grouping.

## Verification

For README-only changes, no app check is needed. For behavior or data changes,
run:

```bash
pnpm test
pnpm typecheck
pnpm build
```

See `agents.md` for architecture, conventions, and what not to add in the POC.
