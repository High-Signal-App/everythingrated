# Glossary

Terms used in this docs tree that are specific to EverythingRated or have a
project-specific meaning. Generic web/Next.js/Drizzle terms are not here —
look those up in their own docs.

- **Directory** — a self-contained collection of rateable things with its own
  aspect rubric. Schema: `directories` table. The product's core unit. See
  [product/directories.md](../product/directories.md).
- **Aspect** — a rating axis scoped to one directory. `(directoryId, key)` is
  unique. An AI tool's aspects differ from a database's. See
  [architecture/data-model.md](../architecture/data-model.md).
- **Item** — a rateable thing inside a directory. `(directoryId, slug)` is
  unique, so two directories can each have an item with the same slug.
- **Rating** — one score (**1–5**) by one visitor on one aspect of one item.
  `rate()` clamps to `1..5`. Append-only; re-rating supersedes the prior row
  (`supersededAt`), it does not overwrite. See
  [architecture/ratings-pipeline.md](../architecture/ratings-pipeline.md).
- **Visitor** — an anonymous rater identified by an httpOnly `er_visitor`
  UUID cookie. Minted lazily on the first `submitRating` Server Action, never
  on reads. See
  [ADR-0001](../architecture/decisions/ADR-0001-no-auth-in-poc.md).
- **Focus directory** — the single directory surfaced in primary nav,
  homepage, sitemap, and cross-directory chips. Currently `ai-dev-tools`.
  Codified in `apps/web/src/lib/directory-focus.ts`. See
  [ADR-0002](../architecture/decisions/ADR-0002-narrow-to-ai-dev-tools.md).
- **Parked directory** — a seeded directory whose routes/feeds/ratings still
  work but is hidden from all primary entry points. `databases`, `hosting`.
  Not deleted — reopenable.
- **Supersede** — on re-rate, the visitor's prior current `ratings` row gets
  `supersededAt = now`; a new row is inserted. Current-view aggregates filter
  `supersededAt IS NULL`.
- **Item version** — a sparse release-timeline row (`item_versions`) used to
  anchor ratings to the version that existed when the rating was made.
  `rate()` auto-resolves the latest version with `releasedAt <= now`.
- **Item tag** — a sparse key/value on `item_tags` used for stack-recommender
  constraint boosts (e.g. `runs-on:cloudflare`). Absence means "no
  constraint", not "false".
- **Stack recommender** — `apps/web/src/lib/stack-recommender.ts`: a visitor
  describes project constraints and gets a rated stack. Tag matches boost
  items.
- **Comparison board** — weighted multi-aspect comparison across items in a
  directory (up to `MAX_COMPARE_ITEMS` = 4). Weights are 0–5 per aspect,
  encoded as `?w=key:value,...`; totals are a weighted mean normalized by total
  weight, so they stay on the same **1–5** scale as the inputs (not 0–10).
- **Agent surface** — machine-readable endpoints (`/llms.txt`,
  `/llms-full.txt`, `/index.md`, `/api/ai`) served by the generated
  `apps/web/agent-edge.mjs`. See
  [architecture/edge-and-agent-surfaces.md](../architecture/edge-and-agent-surfaces.md).
- **Edge cache** — `CACHEABLE_EXACT`/`CACHEABLE_PREFIXES` in `worker.mjs`
  get a long `Cache-Control` so marketing/value-add pages serve in
  sub-second TTFB. Dynamic/per-visitor pages are deliberately excluded.
- **OpenNext** — `@opennextjs/cloudflare`: builds the Next.js app into a
  Cloudflare Worker bundle. `apps/web/next.config.ts` calls
  `initOpenNextCloudflareForDev()` so `next dev` sees the D1 binding.
- **`seed-owner`** — the visitor id used for owner-seeded ratings. The only
  seeded rater in the POC; scores are first-pass author opinion, not
  consensus.
