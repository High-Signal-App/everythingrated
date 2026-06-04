# Project Status

Last updated: 2026-06-04

## Current Scope

EverythingRated is a multi-axis ratings platform. The current POC tests whether directory-specific aspect rubrics are more useful than one collapsed score, using anonymous ratings and narrow seeded directories before adding accounts or broad submission workflows.

## Done

- Multi-directory static seed data (`ai-dev-tools`, `databases`, `hosting`)
- Per-directory aspect rubrics and anonymous multi-axis rating UX
- Visitor cookie (`er_visitor`) minted on first rating only
- Directory comparison boards with tunable aspect weights
- **Directory submission + moderation queue** (`/submit-directory`, `/moderation` with `MODERATION_TOKEN`)
- **Item submission pilot** (`/d/ai-dev-tools/submit`, item queue on `/moderation`; fixture-backed queue, approve writes to D1 `items`)
- Deployed on Cloudflare Workers + D1

## Planned Next

- **Item submissions persistence** — prototype uses in-memory queue + fixtures;
  D1 `item_submissions` table deferred until pilot validates moderation load
- Time-evolving ratings (`plans/0001-time-evolving-ratings.md`) — ready, not started

## Deferred / Parked

- High-signal ingest integration (`plans/0002-signal-ingest.md`)
- Tier-list mode, collaborative list voting, full user auth
- Search, comments, item owner claims, dynamic aspect editing
- Item submission rollout beyond `ai-dev-tools` until moderation pilot is stable

## Recent Symphony task

- `17386fdc` — item submission prototype (fixture queue + moderation UI), completed 2026-06-04.
