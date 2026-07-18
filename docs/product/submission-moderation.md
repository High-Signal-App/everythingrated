# Submission & moderation

Two community loops exist, both gated by an owner-moderated queue. Neither
touches the anonymous rating loop.

## Directory submission

- **Public form: paused (2026-07-03).** `/submit-directory` is now a static
  "submissions paused" page (`force-static`); the `DirectorySubmissionForm`
  component and its `submitDirectory` Server Action were removed while the
  product focuses on AI dev tools. The route stays live for direct links and
  points visitors at the item-submission flow instead.
- **Validation (retained in `lib/directory-submissions.ts`):**
  `validateDirectorySubmission` enforces `MAX_TEXT_LENGTH = 500`, `MIN_ASPECTS
  = 3` / `MAX_ASPECTS = 8`, name ≥ 3 chars, description/heroCopy ≥ 20 chars,
  and normalized aspect labels. Still used when approving existing queued rows.
- **Storage:** `directory_submissions` D1 table (status `pending` by default).
- **Moderation:** the existing `directory_submissions` queue still works on
  `/moderation` (token-gated via `MODERATION_TOKEN`). Approve inserts real
  `directories` + `aspects` rows; reject leaves the row auditable with a
  moderator note.
- **Shipped:** 2026-05; public form paused 2026-07-03.

## Item submission (pilot: `ai-dev-tools` only)

- **Public form:** `/d/ai-dev-tools/submit`. Fields: name, description
  (≥20 chars), https URL, optional contact.
- **Storage:** `item_submissions` D1 table. Statuses:
  `pending | approved | rejected | merged`.
- **Duplicate detection:** against existing items *and* the pending queue.
- **Moderation:** `/moderation` shows a per-directory queue. Approve writes
  to `items`; reject/rollback with notes; `merged` records `mergedIntoItemId`
  for the case where a submission maps to an existing item.
- **Fixtures:** `loadItemSubmissionFixtures()` for seed/dry-runs.
- **Shipped:** 2026-06-13 (plan 0004). Pilot remains `ai-dev-tools` only
  until moderation demand is measured.

## Moderation token

`apps/web/src/lib/moderation.ts` reads `MODERATION_TOKEN` from the Cloudflare
env binding first, falling back to `process.env` for local dev. The token is
passed as a query param to `/moderation`. There is no full auth — see
[ADR-0001](../architecture/decisions/ADR-0001-no-auth-in-poc.md).

## Rate limiting

There is **no rate limiting wired** on submit actions today: `wrangler.toml`
declares no `RATE_LIMITER` binding and no code references one. A limiter is
deferred until endpoint-specific abuse evidence exists — do not add or tighten
limits speculatively; see
[knowledge/failed-approaches.md](../knowledge/failed-approaches.md) for the
fleet-wide stance on stale limiter config.

## Non-goals

- No public admin dashboard beyond the token-gated `/moderation`.
- No dynamic aspect editing on live directories.
- No item owner claims, no collaborative list reordering, no tier-list mode.
- No broad public submission without moderation.
