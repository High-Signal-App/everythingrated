# Current focus

This directory holds short-lived, present-tense pointers: the current
objective, active work, blockers, and next steps. It is the "what now" view;
the durable history lives in [`PROJECT_STATUS.md`](../../PROJECT_STATUS.md)
and the [architecture decisions](../architecture/decisions/).

## Where the current state lives

| You want | Read |
| --- | --- |
| One-screen current state (objective, active work, blockers, next steps) | [`../../STATUS.md`](../../STATUS.md) |
| Full durable history + shipped feature inventory | [`../../PROJECT_STATUS.md`](../../PROJECT_STATUS.md) |
| Why the product is narrowed to `ai-dev-tools` | [`../architecture/decisions/ADR-0002-narrow-to-ai-dev-tools.md`](../architecture/decisions/ADR-0002-narrow-to-ai-dev-tools.md) |
| What is deliberately not being built | [`../knowledge/failed-approaches.md`](../knowledge/failed-approaches.md) |

## Snapshot (2026-07-18)

**Phase:** finish-and-pause (closed 2026-07-10). The `ai-dev-tools` adoption-
decision directory is the retained surface; `databases` and `hosting` are
parked. No new feature waves until the multi-axis thesis is validated
against real raters.

**Active:** repository knowledge system (this docs consolidation);
maintenance-only on the rating surface; doc-drift cleanup in `README.md`.

**Blocking the next phase:** real-rater validation (≥50 raters across ≥5
items). Everything deferred — high-signal ingest, second directory,
time-evolving UI polish — waits on that signal.

Update `../../STATUS.md` when this changes; do not maintain a second copy
here.
