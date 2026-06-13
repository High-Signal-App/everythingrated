# Changelog

Behavioural changes to the rating, comparison, and moderation algorithms.
Anything visible to a visitor (different scores, different ordering, different
rating semantics) should land here so the team can correlate a "why did this
change?" question with a date.

Cosmetic, infra, and seed-data changes do not need entries; check `git log`.

## Unreleased

- Item submissions now persist in D1 `item_submissions` table (pilot: ai-dev-tools).
  Moderation queue, duplicate detection, trust signals, rate limits, approve/merge/reject/rollback all use real rows. Fixtures can be loaded via `loadItemSubmissionFixtures()` for dry-runs. (plans/0004)
- Time-evolving ratings core (plans/0001): ratings are now append-only history. Re-rates supersede prior row (old kept for trends); current aggregates (scores, counts, your, overall, raters) ignore superseded rows. Schema has item_versions + version_id/superseded_at on ratings. Rate auto-anchors version when seeded. (Full 30d/90d windows, sparklines, version UI, seed backfills remain for polish.)
- Item submissions persistence complete for pilot (see prior).

## 2026-05 — Directory moderation queue

- Anonymous visitors can suggest new directories via `/submit-directory`.
- Submissions pass through `validateDirectorySubmission` (length, aspect cap,
  case-insensitive dedup) and a moderator-token-gated approve/reject flow.
- Approved submissions become real directories with the suggested aspect set
  and an empty item list awaiting seeding.

## 2026-05 — Weighted comparison boards

- `/compare-journeys`-style boards weight each aspect's per-item score by a
  user-tunable 0–5 multiplier (`?w=key:value,...`), then divide by total
  weight to keep totals on the original 0–10 scale.
- Weights default to `1`; encoding drops any weight that equals `1` to keep
  shareable URLs short.
- Sort tie-breaks alphabetically on `item.name`.

## Earlier — Per-directory aspects + visitor cookie

- Schema split aspects per directory so an AI editor's axes (Quality, Cost,
  Workflow Fit) differ from a database's (Performance, Reliability, Ops).
- Ratings are scoped per `(item_id, aspect_id, visitor_id)`; re-rating
  upserts.
- Visitor identity is an httpOnly `er_visitor` UUID cookie minted only on the
  first `submitRating` Server Action, never on read pages, so crawlers don't
  pollute the visitor space.
