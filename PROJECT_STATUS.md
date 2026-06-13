# Project Status

Last updated: 2026-06-13

## Current Scope

EverythingRated is a multi-axis ratings platform. The current POC tests whether directory-specific aspect rubrics are more useful than one collapsed score, using anonymous ratings and narrow seeded directories before adding accounts or broad submission workflows.

## Done

- Multi-directory static seed data (`ai-dev-tools`, `databases`, `hosting`)
- Per-directory aspect rubrics and anonymous multi-axis rating UX
- Visitor cookie (`er_visitor`) minted on first rating only
- Directory comparison boards with tunable aspect weights
- **Directory submission + moderation queue** (`/submit-directory`, `/moderation` with `MODERATION_TOKEN`)
- **Item submission pilot** (`/d/ai-dev-tools/submit`, moderation queue on `/moderation` with `MODERATION_TOKEN`; D1 `item_submissions` table + approve writes to `items`; fixtures loadable for dry-runs)
- Deployed on Cloudflare Workers + D1

## Planned Next

- Time-evolving ratings (`plans/0001-time-evolving-ratings.md`) — core done (append-only history, superseded filter for current views, schema/migrations); full windows/trends/sparklines + seed versions polish next
- Expand item submission pilot beyond `ai-dev-tools` (after moderation load validated)

## Deferred / Parked

- High-signal ingest integration (`plans/0002-signal-ingest.md`)
- Tier-list mode, collaborative list voting, full user auth
- Search, comments, item owner claims, dynamic aspect editing
- Item submission rollout beyond `ai-dev-tools` until moderation pilot is stable

## Recent Symphony task

- `17386fdc` — item submission prototype (fixture queue + moderation UI), completed 2026-06-04.
