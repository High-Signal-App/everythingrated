# ADR-0002 — Narrow product to AI dev-tool adoption decisions

Date: 2026-07-03
Status: Active

## Context

The original ambition was a generic any-directory ratings platform. Three
seeded directories shipped (`ai-dev-tools`, `databases`, `hosting`), but the
product had no thesis about *which* decision a visitor was trying to make.
Without a thesis, the multi-axis UX could not be validated: "is this useful?"
had no concrete user job to test against.

## Decision

Narrow the product to **one use case: helping operators decide which AI dev
tools to adopt**. The six axes that drive that call (maintenance, community,
license, API stability, footprint, AI portability) become the `ai-dev-tools`
rubric.

Implementation:

- `apps/web/src/lib/directory-focus.ts` exports `FOCUS_DIRECTORY_SLUG =
  "ai-dev-tools"` and `isParkedDirectory(slug)`.
- Homepage, header nav, footer, sitemap, and cross-directory suggestion chips
  refocus on `ai-dev-tools` only.
- Other seeded directories are **parked, not deleted**: `/d/[directory]`
  routes, feeds, and existing ratings keep working for direct links. No data
  removed.
- Copy updated to sell the adoption-decision thesis.

## Why

- A concrete user job ("should I adopt Cursor vs Claude Code vs Aider?")
  makes the multi-axis bet testable.
- Parking (not deleting) preserves the option to reopen a second directory if
  the thesis proves out and a second directory adds real value.
- One focus directory keeps the moderation pilot tractable.

## Consequences

- `databases` and `hosting` are invisible from primary entry points. Direct
  links still work, which can surprise people who had bookmarks — that is
  intentional.
- Future directories must justify adding real value to the adoption-decision
  surface, not just "more catalogs".
- The generic any-directory ambition is parked, not killed.

## Pointers

- `apps/web/src/lib/directory-focus.ts`.
- [product/directories.md](../../product/directories.md).
- `PROJECT_STATUS.md` "Why / What" section (2026-07-03 entry).
