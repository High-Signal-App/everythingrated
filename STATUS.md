# STATUS

> At-a-glance current state. The durable record is
> [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) — update both together when state
> changes. Last updated: 2026-07-18.

## Objective

Validate the multi-axis rating UX on one concrete user job: **AI dev-tool
adoption decisions**. The broad any-directory ambition is parked. The product
is in a **finish-and-pause** phase (closed 2026-07-10): the `ai-dev-tools`
directory is the retained surface; `databases` and `hosting` stay parked
(routes still work). Reopen expansion only with adoption traffic or
moderation evidence.

## Active work

- **Repository knowledge system** — this consolidation: `docs/` tree as
  source of truth, Blume as presentation layer, link-check CI, `AGENTS.md`
  slimmed to a bootloader. See [`docs/index.md`](./docs/index.md).
- **Doc-drift cleanup** — `README.md` POC guidance still says "avoid
  submissions" while the `ai-dev-tools` submission pilot + token-gated
  moderation are shipped. Reconcile on the next README pass.
- **Maintenance only** on the rating surface — no new feature waves planned
  until the adoption-decision thesis is validated against real raters.

## Blockers

- **No real-rater validation yet.** Owner is the only seeded rater
  (`visitor_id = "seed-owner"`); scores are first-pass author opinion. The
  multi-axis bet is untested against ≥50 raters across ≥5 items (the bar set
  in [ADR-0004](./docs/architecture/decisions/ADR-0004-signal-ingest-deferred.md)
  for revisiting deferred work).
- **Time-evolving ratings UI not visible.** The append-only core + supersede
  logic shipped (plan 0001), but sparklines, rolling windows, and version
  anchoring UI are deferred. Aggregates behave as a "latest view" only.
- **Playwright e2e not in CI.** `apps/web/e2e/mobile.spec.ts` and
  `pnpm --filter web test:e2e` exist but are not wired to any workflow. Green
  CI does not imply e2e passed.
- **No rate limiting wired** — no `RATE_LIMITER` binding in `wrangler.toml`
  and no code references one; deferred until endpoint-specific abuse evidence
  exists. Do not add or tighten speculatively.

## Open questions

- **Second directory?** Reopen `databases` or `hosting` (or a new directory)
  only if the adoption thesis proves out *and* a second directory adds real
  value to the adoption-decision surface — not just "more catalogs". See
  [ADR-0002](./docs/architecture/decisions/ADR-0002-narrow-to-ai-dev-tools.md).
- **Aggregation path.** `listItemsWithAggregates` is a directory-scoped full
  pull + JS reduce. Fine at POC scale; swap to SQL `AVG`/`GROUP BY` against
  `ratings_superseded_idx` if a directory grows. When does that trigger?
- **High-signal ingest.** Deferred (ADR-0004). Revisit only when all three
  conditions hold: rating UX validated, `high-signal` production-reliable,
  third consumer exists. Prefer Option C (shared package) over Option B.

## Next steps

1. Get real raters on `ai-dev-tools` (≥50 across ≥5 items) to validate or
   refute the multi-axis thesis — this unblocks every deferred decision.
2. Reconcile `README.md` submission guidance with the shipped pilot.
3. Wire Playwright e2e into CI (or explicitly document it as manual-only).
4. On the next schema change, decide whether aggregation moves to SQL.
5. Keep `docs/` in sync with code; run `pnpm docs:check` before pushing
   doc changes (enforced in `.github/workflows/docs.yml`).
