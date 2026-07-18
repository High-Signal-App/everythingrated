# ADR-0004 — Defer high-signal external sentiment ingest

Date: 2026-04-26
Status: Deferred (revisit conditions below)

## Context

`plans/0002-signal-ingest.md` designed EverythingRated as a consumer of the
sibling `high-signal` repo's sentiment + mention-volume engine (Modal cron,
Reddit/HN/news/GitHub adapters, entity gazetteer, Hono/D1 API). The plan
picked **Option B** (multi-collection engine: add a `collection` field to
`high-signal`'s `entities` so AI dev tools become a second collection alongside
AI infra).

## Decision

**Defer the integration.** Do not wire EverythingRated to `high-signal` in
the POC. The plan is preserved verbatim in `plans/0002-signal-ingest.md`
because the API contract, intent taxonomy, caching strategy, and
entity-resolution scheme remain useful if integration is ever revisited.

## Why

- **Shallow reuse.** Net real reuse from `high-signal` ≈ Reddit adapter + HN
  adapter + Modal cron (~2.5 days saved). FinBERT is wrong for dev-tool
  slang; the entity gazetteer is different; signal cards and the hit-rate
  ledger are out of scope.
- **Coupling is forever.** Every change to `high-signal`'s
  `entities.{collection,slug}` or `events.{sentimentLabel,sentimentScore,
  intent}` becomes a breaking change for this repo. EverythingRated's
  prod-readiness would depend on `high-signal`'s, whose own README says
  "research artifact first, product later, if at all".
- **Option B is worst-of-both** with one consumer. The right answer with one
  consumer is *no cross-repo wiring* — either Option C (shared `signal-engine`
  package) when a third consumer appears, or EverythingRated grows ~50 lines
  of its own Reddit polling.
- **Wrong v0 question.** EverythingRated v0 is testing whether multi-axis
  ratings + time-evolution feels right. External sentiment is nice-to-have,
  not the question being answered. Plan 0001 (time-evolving ratings) is what
  matters now.

## Revisit conditions

Revisit only when **all three** are true:

1. EverythingRated rating UX is validated against real users (≥50 raters
   across ≥5 items, signal that the multi-axis frame is the right frame).
2. `high-signal` has shipped its own AI-infra wedge to a state the owner
   would call "production reliable".
3. A third consumer of signal data exists or is concretely planned.

If only (1) and (2) are true, prefer EverythingRated growing ~50 lines of
standalone Reddit/HN polling over re-opening this plan. If all three are
true, **revisit Option C, not Option B** — the Option B analysis was written
assuming B, and the producer-side commitments in
`high-signal/plans/0003-multi-collection-for-everythingrated.md` are also
deferred and may need reframing.

## Pointers

- `plans/0002-signal-ingest.md` — full design (preserved verbatim).
- [knowledge/failed-approaches.md](../../knowledge/failed-approaches.md) —
  cross-repo coupling as a recurring trap.
