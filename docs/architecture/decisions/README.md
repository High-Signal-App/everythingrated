# Architecture decisions

This directory holds thin ADRs (Architecture Decision Records) for choices
that are **not** already captured in a `plans/` document. Each ADR is short:
context, decision, why, pointers to code and follow-ups.

Long-form design notes that are no longer part of the rendered documentation
surface remain in git history. This directory is the rendered decision index.

## ADRs in this directory

| ADR | Decision | Status |
| --- | --- | --- |
| [ADR-0001](ADR-0001-no-auth-in-poc.md) | No auth in the POC; anonymous `er_visitor` cookie only | Active |
| [ADR-0002](ADR-0002-narrow-to-ai-dev-tools.md) | Narrow product to AI dev-tool adoption decisions | Active |
| [ADR-0003](ADR-0003-inline-configs-drop-saas-maker.md) | Inline configs, drop `@saas-maker/{tsconfig,eslint,test}` deps | Active |
| [ADR-0004](ADR-0004-signal-ingest-deferred.md) | Defer high-signal external sentiment ingest | Deferred |

## Historical plan index

| Plan | Title | Status | One-line |
| --- | --- | --- | --- |
| 0001 | Time-evolving ratings | Core shipped 2026-06-13 | Append-only `ratings` with `supersededAt`; current aggregates filter superseded rows. |
| 0002 | High-signal ingest | Deferred 2026-04-26 | Deferred; see [ADR-0004](ADR-0004-signal-ingest-deferred.md). |
| 0003 | Directories | Shipped 2026-04-27 | Static multi-directory data model and seed set. |
| 0004 | Moderated dynamic submissions | Shipped 2026-06-13 | `item_submissions` D1 table and moderation flow. |

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
