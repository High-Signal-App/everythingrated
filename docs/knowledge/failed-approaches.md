# Failed and deferred approaches

Approaches that were tried and rejected, or deliberately deferred, with the
reason. Read this before retrying a dead end — the next agent should not spend
a turn rediscovering why something doesn't work here. Update this page when an
approach is abandoned or a deferred idea is revisited.

The durable status record is [`PROJECT_STATUS.md`](../../PROJECT_STATUS.md);
this page is the curated "do not retry without new information" list.

## Rejected: auth in the POC

**Why rejected:** the product hypothesis is the multi-axis rubric, not
identity. Auth would slow the loop the POC is testing and create a spam
surface that needs moderation before the UX is proven. Anonymous ratings
scoped by an httpOnly `er_visitor` cookie (minted lazily on the first
`submitRating`, never on reads) validate the bet with the smallest move.
See [ADR-0001](../architecture/decisions/ADR-0001-no-auth-in-poc.md).

Do not reintroduce auth without a concrete job that identity unlocks (cross-
device ratings, owner claims, role-based moderation beyond the shared
secret).

## Rejected: middleware that mints the visitor cookie on reads

**Why rejected:** minting `er_visitor` on read pages would (a) re-pollute the
visitor space with bot/crawler cookies and (b) break page-render caching.
Visitor ids are minted **only** in mutating Server Actions. This is load-
bearing — do not add middleware that mints cookies on reads without
revisiting both trade-offs. See
[architecture/overview.md](../architecture/overview.md#why-no-middleware).

## Rejected: cross-repo coupling to `high-signal` (Option B)

**Why rejected:** wiring EverythingRated to the sibling `high-signal` repo as
a consumer (plan 0002, Option B — multi-collection engine) gives ~2.5 days of
real reuse (Reddit + HN adapters + Modal cron) in exchange for permanent
coupling: every change to `high-signal`'s `entities`/`events` schema becomes
a breaking change for this repo, and this repo's prod-readiness would depend
on `high-signal`'s, whose own README says "research artifact first". With one
consumer the right answer is *no cross-repo wiring*. See
[ADR-0004](../architecture/decisions/ADR-0004-signal-ingest-deferred.md).

Revisit only when all three hold: rating UX validated (≥50 raters / ≥5
items), `high-signal` production-reliable, a third consumer exists. If all
three hold, revisit **Option C** (shared `signal-engine` package), not
Option B.

## Rejected: `@saas-maker/{tsconfig,eslint,test}` shared config deps

**Why rejected:** the template pulled in unpublished/stub shared config
packages, creating install drift. Configs are inlined directly in this repo
so they are diffable and obvious. `@saas-maker/feedback`,
`@saas-maker/changelog-widget`, and `@saas-maker/testimonials` are runtime
widgets, not configs — they stay. See
[ADR-0003](../architecture/decisions/ADR-0003-inline-configs-drop-saas-maker.md).

## Rejected: broad public submission without moderation

**Why rejected:** public item submission without a moderation queue is a spam
firehose and a trust-erosion vector. Submission is gated: directory
submissions via `/submit-directory` → token-gated `/moderation`; item
submissions via `/d/ai-dev-tools/submit` → same queue (pilot, `ai-dev-tools`
only). Do not open broad public submission without a moderation plan. See
[product/submission-moderation.md](../product/submission-moderation.md).

## Deferred: time-evolving ratings UI polish

**What shipped:** the append-only core — `ratings` with `supersededAt`,
`item_versions`, `versionId`, indexes, auto version resolution. Current
aggregates behave as a "latest view".

**What is deferred** (do not implement without revisiting): rolling 30d/90d
time windows, trend sparklines on item pages, `last_release`/staleness UI,
seed version backfill, and the `rating_snapshots` materialized table (only
if item page exceeds ~50ms p95). See
[architecture/ratings-pipeline.md](../architecture/ratings-pipeline.md) and
`plans/0001-time-evolving-ratings.md`.

## Deferred: item submission rollout beyond `ai-dev-tools`

**Why deferred:** the pilot is `ai-dev-tools` only until moderation demand is
measured. Expanding to other directories is paused pending that evidence.
See [product/submission-moderation.md](../product/submission-moderation.md).

## Deferred: wiring `RATE_LIMITER` on all submit actions

**Why deferred:** the Workers `RATE_LIMITER` binding exists but is not wired
to every submit endpoint. Tightening limits speculatively, without
endpoint-specific abuse evidence, is a fleet-wide anti-pattern — stale
limiter config causes more outages than it prevents. Wire it per-endpoint
only when abuse evidence appears. See
[product/submission-moderation.md](../product/submission-moderation.md#rate-limiting).

## Not yet done (gaps, not rejections)

- **Playwright e2e not in CI.** `apps/web/e2e/mobile.spec.ts` and
  `pnpm --filter web test:e2e` exist but are not wired to any workflow. Green
  CI does not imply e2e passed. Either wire it or document it as manual-only.
- **No automated D1 backup.** Run `wrangler d1 export` before destructive
  migrations. See
  [operations/runbooks/d1-migrations.md](../operations/runbooks/d1-migrations.md).
