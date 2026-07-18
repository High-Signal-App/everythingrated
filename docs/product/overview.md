# Product overview

## What it is

EverythingRated is a multi-axis ratings platform. Instead of collapsing a
tool, product, or service into a single star score, each **directory**
defines the **aspects** that matter for that kind of thing, and visitors rate
items across those aspects. An AI editor is judged on different axes than a
database or a hosting provider.

Live site: <https://ratings.highsignal.app>

## The bet being tested

Most rating apps ask for one number and lose the decision context. The
product hypothesis is that a **directory-specific rubric** is more useful than
a collapsed score: it preserves the trade-offs that actually drive an
adopt/skip call.

The POC is intentionally narrow so the multi-axis UX can be validated before
adding accounts, broad submissions, or moderation at scale.

## Current focus (2026-07-03)

The product is narrowed to **one use case: AI dev-tool adoption decisions**.
Only `ai-dev-tools` is surfaced on the homepage, nav, footer, and sitemap.
Other seeded directories (`databases`, `hosting`) are **parked, not deleted**:
their routes, feeds, and existing ratings still work for direct links, but
they are hidden from all primary entry points. See
[`apps/web/src/lib/directory-focus.ts`](../../apps/web/src/lib/directory-focus.ts)
and [ADR-0002](../architecture/decisions/ADR-0002-narrow-to-ai-dev-tools.md).

## Users

- **Anonymous visitors** rate items. Identity is an httpOnly `er_visitor`
  cookie minted on the first rating action — no accounts.
- **A moderator** (owner, POC) approves/rejects community-submitted
  directories and items via a token-gated `/moderation` queue.

## In scope

- `ai-dev-tools` as the primary product surface.
- Multi-axis rating UX, comparison boards, ranked/discovery views.
- Moderated item submission for `ai-dev-tools` (pilot).
- Moderated directory submission.
- D1 on Cloudflare Workers via OpenNext.

## Parked (routes still work)

- `databases`, `hosting`, and other seeded directories. Reopen only if the
  adoption-decision thesis proves out and a second directory adds real value.

## Out of scope (do not add without a plan)

- Full user auth / OAuth.
- Tier-list mode, collaborative list voting, search, comments.
- Item owner claims, dynamic aspect editing on live directories.
- Broad public submission without moderation.
- Generic any-directory expansion.
- High-signal external sentiment ingest (see
  [ADR-0004](../architecture/decisions/ADR-0004-signal-ingest-deferred.md)).

## Seeded data

Owner is the only seeded rater (`visitor_id = "seed-owner"`). Scores are
first-pass author opinion, not community consensus — replace with real
ratings after usage. Seed is reproducible via `scripts/seed-d1.ts`; see
[development/seed-data.md](../development/seed-data.md).

## Related

- [directories.md](directories.md) — the directory model and parked behavior.
- [rating-ux.md](rating-ux.md) — the rating interaction and aggregation UX.
- [submission-moderation.md](submission-moderation.md) — community submissions.
