# Testing

## Vitest (unit / logic)

- Config: `vitest.config.ts` at repo root.
- Environment: `node`. Globals enabled. Timeout 15s.
- Include: `apps/web/src/**/*.test.ts`.
- Exclude: `.open-next/**`, `node_modules/**`.
- Coverage: v8, over `apps/web/src/lib/**/*.ts` and `packages/db/src/**/*.ts`,
  with thresholds lines/functions/statements ≥80%, branches ≥70%.

Current test files (co-located with their modules):

| File | Exercises |
| --- | --- |
| `apps/web/src/lib/collections.test.ts` | collection helpers |
| `apps/web/src/lib/comparison.test.ts` | weighted comparison boards |
| `apps/web/src/lib/directory-submissions.test.ts` | directory submission validation + moderation |
| `apps/web/src/lib/item-submissions.test.ts` | item submission validation, dedup, moderation |
| `apps/web/src/lib/query-intent.test.ts` | query intent parsing |
| `apps/web/src/lib/stack-recommender.test.ts` | stack recommender constraint boosts |

Run:

```bash
pnpm test              # one shot
pnpm test:watch        # watch
pnpm test:coverage     # with v8 coverage
```

## Playwright (e2e, not in CI)

- Config: `apps/web/playwright.config.ts`.
- Spec: `apps/web/e2e/mobile.spec.ts`.
- Run: `pnpm --filter web test:e2e`.

Playwright is **not wired into CI**. The spec exists for manual checks. Do
not assume green CI means e2e passed. See
[knowledge/failed-approaches.md](../knowledge/failed-approaches.md) for the
gap.

## CI

`.github/workflows/ci.yml` runs on every push and PR:

1. `pnpm install --frozen-lockfile`
2. `pnpm run lint`
3. `pnpm run typecheck`
4. `pnpm run test`
5. `pnpm run cf:build`

A separate `.github/workflows/docs.yml` (added with this docs system) runs
`pnpm docs:check` to catch broken Markdown links and structure issues. See
[../operations/jobs.md](../operations/jobs.md).

## What to test

- **Logic that can drift silently:** comparison weighting, submission
  validation, dedup, stack-recommender boosts, query intent parsing.
- **Aggregation correctness:** `ratings.ts` current-view filtering
  (`supersededAt IS NULL`).
- **Not worth a test in POC:** static page rendering, copy, seed data values
  (those are validated by `pnpm db:seed:local` + manual click-through).
