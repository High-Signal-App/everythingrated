# Commands

The authoritative list of scripts lives in `package.json`,
`apps/web/package.json`, and `packages/db/package.json`. This page groups
them by purpose so you do not have to grep. If a script is missing here, read
the manifest.

## Local dev

| Command | Purpose |
| --- | --- |
| `pnpm dev` | `next dev -p 3000` (web workspace). |
| `pnpm start` | `next start` (production server, local). |
| `pnpm db:studio` | drizzle-kit studio — browse local D1 in a browser. |

## Build & deploy

| Command | Purpose |
| --- | --- |
| `pnpm build` | `next build --webpack` (Next.js build). |
| `pnpm cf:build` | `opennextjs-cloudflare build` (Cloudflare bundle). |
| `pnpm deploy` | `opennextjs-cloudflare build && deploy`. **Manual only** — not wired to push. |

## Database

| Command | Purpose |
| --- | --- |
| `pnpm db:generate` | drizzle-kit generate — regen migrations after schema edit. |
| `pnpm db:migrate:local` | Apply migrations to local D1 (`.wrangler/`). |
| `pnpm db:migrate:remote` | Apply migrations to production `everythingrated-db`. |
| `pnpm db:seed:local` | `tsx scripts/seed-d1.ts --local`. |
| `pnpm db:seed:remote` | `tsx scripts/seed-d1.ts --remote`. |

Migrations are forward-only — see
[../operations/runbooks/d1-migrations.md](../operations/runbooks/d1-migrations.md).

## Quality

| Command | Purpose |
| --- | --- |
| `pnpm test` | Vitest run (validation + comparison assertions). |
| `pnpm test:coverage` | Vitest with v8 coverage. |
| `pnpm test:watch` | Vitest watch. |
| `pnpm typecheck` | `tsc --noEmit` across workspaces. |
| `pnpm lint` | Recursive lint (`apps/web` lint script is a no-op echo — Next 16 deprecated `next lint`; Biome is the real formatter/checker). |
| `pnpm check` | `biome check .`. |
| `pnpm format` | `biome format --write .`. |
| `pnpm format:check` | `biome format .` (no writes). |

## E2E (not wired to CI)

| Command | Purpose |
| --- | --- |
| `pnpm --filter web test:e2e` | Playwright run (`apps/web/e2e/mobile.spec.ts`). |

Playwright exists but is **not** in CI. See
[testing.md](testing.md) and [knowledge/failed-approaches.md](../knowledge/failed-approaches.md).

## Docs

| Command | Purpose |
| --- | --- |
| `pnpm docs:check` | Validate docs structure + internal Markdown links. |
| `pnpm docs:build` | Build the Blume docs site into `dist/` (presentation layer). |
| `pnpm docs:dev` | Blume dev server with hot reload. |

See [../operations/build-docs.md](../operations/build-docs.md).

## Husky / hooks

| Command | Purpose |
| --- | --- |
| `pnpm prepare` | `husky` install (runs on `pnpm install`). |

`.husky/pre-push` runs lint + secret scan. See
[../operations/jobs.md](../operations/jobs.md).
