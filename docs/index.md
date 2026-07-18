# EverythingRated — Documentation

This `docs/` tree is the canonical, committed source of truth for
EverythingRated. Markdown here is authoritative; the Blume site
(`blume.config.ts` at repo root) is only the presentation and search layer
over these same files.

For a one-screen agent bootloader, see [`../agents.md`](../agents.md).
For the current objective, active work, and blockers, see
[`../STATUS.md`](../STATUS.md).

## Where to start

| You want to | Read |
| --- | --- |
| Current objective, blockers, next steps | [`../STATUS.md`](../STATUS.md), [current/](current/) |
| Understand the product bet and scope | [product/overview.md](product/overview.md) |
| See the system architecture | [architecture/overview.md](architecture/overview.md) |
| Understand the data model | [architecture/data-model.md](architecture/data-model.md) |
| Know how ratings aggregate and evolve | [architecture/ratings-pipeline.md](architecture/ratings-pipeline.md) |
| Set up local dev | [development/setup.md](development/setup.md) |
| Run migrations safely | [operations/runbooks/d1-migrations.md](operations/runbooks/d1-migrations.md) |
| Deploy | [operations/deploy.md](operations/deploy.md) |
| CI + scheduled jobs | [operations/jobs.md](operations/jobs.md) |
| Build the docs site (Blume) | [operations/build-docs.md](operations/build-docs.md) |
| Review past decisions | [architecture/decisions/](architecture/decisions/) |
| Avoid repeating dead ends | [knowledge/failed-approaches.md](knowledge/failed-approaches.md) |
| Reusable learnings & glossary | [knowledge/learnings.md](knowledge/learnings.md), [knowledge/glossary.md](knowledge/glossary.md) |

## Structure

```
docs/
  index.md                      this file
  current/                      present-tense pointers (objective, blockers)
  product/                      what the product is and is not
  architecture/                 how it works
  architecture/decisions/       ADRs (thin) + pointer index to plans/
  development/                  local dev, commands, conventions, testing
  operations/                   deploy, jobs, build-docs, runbooks
  operations/runbooks/          step-by-step operational procedures
  knowledge/                    learnings, failed approaches, glossary
  archive/                      superseded docs kept for history
```

`plans/` (repo root, not under `docs/`) holds the original long-form design
documents. `docs/architecture/decisions/README.md` indexes them and links in.
Do not duplicate plan content in `docs/` — link to `plans/` instead.

## Maintenance rules

1. Markdown in this tree is the source of truth. If a fact is missing or
   wrong, fix it here first, then update code comments or `agents.md`.
2. One fact, one home. Do not re-explain something that has a canonical page
   — link to it.
3. Do not duplicate what code already says (table columns, route lists, script
   names). Describe *why* and *how it fits together*; link to the code.
4. Mark unresolved questions explicitly with `TBD` or an "Open questions"
   section. Do not invent rationale.
5. Keep pages short (150–300 lines). Split a page when it grows past that.
6. When a doc is superseded, move it to `docs/archive/` rather than deleting,
   so git rename history is preserved.
7. After editing, run `pnpm docs:check` to validate links and structure.
