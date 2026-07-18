# ADR-0003 — Inline configs, drop @saas-maker shared config deps

Date: 2026-06 (commits `5bd5e55`, `c3c4233`)
Status: Active

## Context

The repo was scaffolded from a truehire-style template that pulled in
`@saas-maker/{tsconfig,eslint-config,test-config}`. Those packages were not
published to a registry this repo could reliably consume, were empty/stub in
practice, and created install drift. Vitest was also configured through the
shared test-config.

## Decision

Inline the configs directly in this repo:

- `tsconfig.json` at root + per-workspace `tsconfig.json` use upstream
  TypeScript options directly.
- `apps/web/eslint.config.mjs` uses `eslint-config-next` directly.
- `vitest.config.ts` at root is a plain `defineConfig` (formerly
  `@saas-maker/test-config/vitest`).
- Remove the `@saas-maker/*` dev dependencies that only provided configs.
- Migrate the test suite to Vitest (from the shared runner).

`@saas-maker/feedback`, `@saas-maker/changelog-widget`, and
`@saas-maker/testimonials` are **runtime widgets**, not configs — they stay.

## Why

- The POC should not depend on uncommitted external packages.
- Inlined configs are diffable and obvious; nothing hidden behind a version
  range.
- One less source of install drift across the fleet.

## Consequences

- Config changes are local to this repo (good for POC; means no shared fleet
  config reuse without copying).
- If the fleet later publishes real shared configs, re-adopting is a
  deliberate move, not a default.

## Pointers

- `tsconfig.json`, `apps/web/tsconfig.json`, `packages/db/tsconfig.json`.
- `apps/web/eslint.config.mjs`.
- `vitest.config.ts`.
- Git: `5bd5e55`, `c3c4233`.
