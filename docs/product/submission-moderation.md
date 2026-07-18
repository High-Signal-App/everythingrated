# Submission & moderation

Two community loops exist, both gated by an owner-moderated queue. Neither
touches the anonymous rating loop.

## Directory submission

- **Public form:** `/submit-directory` (`directory-submission-form.tsx`).
- **Validation:** `validateDirectorySubmission` enforces length caps, 3–8
  aspects, optional email, case-insensitive slug dedup.
- **Storage:** `directory_submissions` D1 table (status `pending` by default).
- **Moderation:** `/moderation` (token-gated via `MODERATION_TOKEN` query
  param). Approve inserts real `directories` + `aspects` rows; reject leaves
  the row auditable with a moderator note.
- **Shipped:** 2026-05.

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

The Workers `RATE_LIMITER` binding is intended for submit actions. As of the
last status update it is **not wired to every endpoint** — it is paused until
endpoint-specific abuse evidence exists. Do not tighten limits speculatively;
see [knowledge/failed-approaches.md](../knowledge/failed-approaches.md) for
the fleet-wide stance on stale limiter config.

## Non-goals

- No public admin dashboard beyond the token-gated `/moderation`.
- No dynamic aspect editing on live directories.
- No item owner claims, no collaborative list reordering, no tier-list mode.
- No broad public submission without moderation.
