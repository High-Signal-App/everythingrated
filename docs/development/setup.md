# Local development setup

## Prerequisites

- Node ≥ 20 (Blume docs tooling needs ≥ 22.12 if you use it — see
  [../operations/build-docs.md](../operations/build-docs.md)).
- pnpm 10.33.2 (pinned via `packageManager` in `package.json`; corepack will
  pick it up).
- Cloudflare Wrangler (comes with `apps/web` devDependencies) for local D1.

## First-time setup

```bash
pnpm install
cp .env.example .env.local       # see below
pnpm db:migrate:local            # apply migrations to local D1 (.wrangler/)
pnpm db:seed:local               # seed local D1 from scripts/seed-d1.ts
pnpm dev                         # http://localhost:3000
```

Open `/` for the directory grid; click a tool for the multi-axis rating page.

## Environment

`.env.example` is the canonical list of env vars. Do not commit real values.

| Var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Local app URL (defaults to `http://localhost:3000`). |
| `MODERATION_TOKEN` | Shared secret gating `/moderation`. Empty in local dev is fine. |
| `NEXT_PUBLIC_SAASMAKER_API_KEY` | SaaS Maker widget key (public). |
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | PostHog analytics. |

The D1 binding is declared in `apps/web/wrangler.toml` — **no DB env vars
needed**. `apps/web/next.config.ts` calls `initOpenNextCloudflareForDev()` so
`next dev` sees the local D1 from `.wrangler/`.

## Local D1

Local D1 state lives under `apps/web/.wrangler/`. To wipe and reseed from
scratch:

```bash
rm -rf apps/web/.wrangler/state/v3/d1
pnpm db:migrate:local
pnpm db:seed:local
```

## Day-to-day commands

See [commands.md](commands.md) for the full script index. The short version:

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Next.js dev server on :3000. |
| `pnpm test` | Vitest validation + comparison assertions. |
| `pnpm typecheck` | `tsc --noEmit` across workspaces. |
| `pnpm lint` | Recursive lint. |
| `pnpm check` | Biome check (format + lint). |
| `pnpm format` | Biome format write. |
| `pnpm db:generate` | Regenerate Drizzle migrations after schema change. |
| `pnpm db:studio` | Browse local D1 via drizzle-kit studio. |

## Verification before pushing

`.husky/pre-push` runs lint + a secret scan automatically. For behavior or
data changes, also run:

```bash
pnpm test
pnpm typecheck
pnpm build
```

For README/docs-only changes, no app check is needed, but run
`pnpm docs:check` to validate links — see
[../operations/build-docs.md](../operations/build-docs.md).
