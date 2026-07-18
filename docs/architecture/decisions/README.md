# Architecture decisions

This directory holds thin ADRs (Architecture Decision Records) for choices
that are **not** already captured in a `plans/` document. Each ADR is short:
context, decision, why, pointers to code and follow-ups.

For long-form design documents, see [`../../../plans/`](../../../plans/) —
those remain the authoritative source for the big designs. This index links
to them so you do not have to hunt.

## ADRs in this directory

| ADR | Decision | Status |
| --- | --- | --- |
| [ADR-0001](ADR-0001-no-auth-in-poc.md) | No auth in the POC; anonymous `er_visitor` cookie only | Active |
| [ADR-0002](ADR-0002-narrow-to-ai-dev-tools.md) | Narrow product to AI dev-tool adoption decisions | Active |
| [ADR-0003](ADR-0003-inline-configs-drop-saas-maker.md) | Inline configs, drop `@saas-maker/{tsconfig,eslint,test}` deps | Active |
| [ADR-0004](ADR-0004-signal-ingest-deferred.md) | Defer high-signal external sentiment ingest | Deferred |

## Plan index (long-form designs in `plans/`)

| Plan | Title | Status | One-line |
| --- | --- | --- | --- |
| [0001](../../../plans/0001-time-evolving-ratings.md) | Time-evolving ratings | Core shipped 2026-06-13 | Append-only `ratings` with `supersededAt`; current aggregates filter superseded rows. Polish (windows, sparklines, version UI) deferred. |
| [0002](../../../plans/0002-signal-ingest.md) | High-signal ingest | Deferred 2026-04-26 | EverythingRated consumes `high-signal` sentiment. Revisit only when rating UX is validated, high-signal is production-reliable, and a third consumer appears. See [ADR-0004](ADR-0004-signal-ingest-deferred.md). |
| [0003](../../../plans/0003-directories.md) | Directories (static multi-directory) | Shipped 2026-04-27 | Directories, items, aspects scoped per-directory; fresh DB; 3 seeded directories. |
| [0004](../../../plans/0004-moderated-dynamic-submissions.md) | Moderated dynamic submissions | Shipped 2026-06-13 | `item_submissions` D1 table + moderation flow for `ai-dev-tools` pilot. |

## When to add an ADR

Add an ADR when a decision is made that is **not** obvious from the code and
**not** already in a `plans/` document. If a full design lives in `plans/`,
link to it from this index instead of duplicating it.

Format:

```
# ADR-NNNN — <short title>

Date: YYYY-MM-DD
Status: Active | Superseded by ADR-XXXX | Deferred | Rejected

## Context
## Decision
## Why
## Consequences
## Pointers
```
