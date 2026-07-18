# ADR-0001 — No auth in the POC

Date: 2026-04 (POC start)
Status: Active

## Context

The product hypothesis is that a directory-specific multi-axis rubric is more
useful than a collapsed score. Validating it requires real rating
interactions, not accounts, profiles, or OAuth flows. Adding auth early would
slow the loop the POC is actually trying to test, and would create a spam
surface that needs moderation before the UX is proven.

## Decision

Ratings are anonymous. Visitor identity is an httpOnly `er_visitor` UUID
cookie, minted **lazily** on the first `submitRating` Server Action and never
on read pages. One score per `(item, aspect, visitor)`; re-rating supersedes
the prior row.

## Why

- **Cacheability:** page renders stay cacheable because reads never mint
  cookies. Bots and crawlers do not pollute the visitor space.
- **Spam containment:** the only moderation surface is the submission queue,
  gated by `MODERATION_TOKEN`. Rating spam is bounded by cookie minting
  requiring a Server Action round-trip.
- **Smallest move:** the bet is the multi-axis UX, not identity. Auth can be
  added later without reshaping the rating model.

## Consequences

- No per-user profiles, no "my ratings" tied to an account. `/my` is scoped
  to the cookie and is therefore device-local.
- No way to recover ratings across devices or after cookie clear.
- Moderation is owner-only via a shared secret, not role-based.

## Pointers

- `apps/web/src/lib/visitor.ts` — `readVisitorId` / `ensureVisitorId`.
- `apps/web/src/lib/moderation.ts` — token gating.
- [product/overview.md](../../product/overview.md) — out-of-scope list.
