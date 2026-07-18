# Jobs (scheduled + CI)

Code is authoritative for schedules and triggers — this page indexes what
runs automatically and points at the source. Do not duplicate trigger details
here; read the workflow files.

## CI workflows (`.github/workflows/`)

| Workflow | Trigger | What it does | Source |
| --- | --- | --- | --- |
| `ci.yml` | push, pull_request | `install --frozen-lockfile` → `lint` → `typecheck` → `test` → `cf:build`. The blocking gate. | [`ci.yml`](../../.github/workflows/ci.yml) |
| `docs.yml` | push/PR to main, `workflow_dispatch` | `links` job: dependency-free Markdown link check (`scripts/validate-docs.sh`). `blume-build` job: opt-in render verify (non-blocking). | [`docs.yml`](../../.github/workflows/docs.yml) |
| `cloudflare-deploy.yml` | `workflow_dispatch` only | `typecheck` → `pnpm deploy` → smoke `https://ratings.highsignal.app/`. Manual; never auto on push. | [`cloudflare-deploy.yml`](../../.github/workflows/cloudflare-deploy.yml) |
| `weekly.yml` | cron `0 9 * * 1` (Mon 09:00 UTC), `workflow_dispatch` | Runs available quality scripts (lint/typecheck/test/build) as a drift catch. | [`weekly.yml`](../../.github/workflows/weekly.yml) |

## Husky hooks (`.husky/`)

| Hook | What it does | Source |
| --- | --- | --- |
| `pre-push` | Runs `pnpm lint` if a `lint` script exists, then a secret scan over tracked files (aborts on likely tokens/keys, with fixture/example exclusions). | repository-root `.husky/pre-push` |

`pnpm prepare` installs husky on `pnpm install`. The secret-scan regex lives
inline in `pre-push` — extend it there if a new secret shape needs coverage.

## Scheduled application jobs

**None.** EverythingRated has no cron workers, no scheduled Durable Object
alarms, and no background ingest. The `high-signal` integration that would
have introduced scheduled ingest is deferred — see
[ADR-0004](../architecture/decisions/ADR-0004-signal-ingest-deferred.md). Do
not add a scheduled job without first revisiting that decision.

## Notes

- The `weekly.yml` workflow is defensive about package managers (pnpm/npm/yarn
  fallbacks) because it predates the pnpm pin. It works, but `ci.yml` is the
  authoritative gate.
- `cloudflare-deploy.yml`'s smoke step hits the workers.dev origin, not the
  `ratings.highsignal.app` custom domain — both route to the same Worker.
- Playwright e2e (`pnpm --filter web test:e2e`) is **not** in any workflow.
  See [../development/testing.md](../development/testing.md) and
  [../knowledge/failed-approaches.md](../knowledge/failed-approaches.md).
