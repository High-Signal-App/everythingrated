# new-things — study queue

Short stubs for non-standard tech in this repo. 3–5 lines each. Fill `Why here:`
yourself after learning; never invent rationale.

## Multi-axis rating rubrics
- What: Rating items across multiple per-directory aspects instead of a single collapsed score
- Why here: TBD
- Gotcha (from code): `packages/db/src/schema.ts:50-65` — `aspects` table has unique constraint on `(directoryId, key)` so each directory defines its own rating axes
- Source: https://en.wikipedia.org/wiki/Multi-criteria_decision_analysis

## Time-evolving ratings with supersededAt
- What: Append-only rating history with soft deletes via a `supersededAt` timestamp
- Why here: TBD
- Gotcha (from code): `packages/db/src/schema.ts:132` — `supersededAt` column marks old ratings as superseded when a user re-rates, preserving full history without deletes
- Source: https://martinfowler.com/articles/temporal-data.html

## Version-anchored ratings
- What: Linking ratings to specific item versions for historical accuracy — ratings always reflect the version that existed when the rating was made
- Why here: TBD
- Gotcha (from code): `apps/web/src/lib/ratings.ts:344-352` — auto-resolves `versionId` by finding the latest `item_version` with `releasedAt <= now`
- Source: https://martinfowler.com/articles/evolutionaryDatabase.html

## Drizzle D1 HTTP driver
- What: Using Drizzle ORM with the D1 HTTP driver instead of local SQLite for Cloudflare D1
- Why here: TBD
- Gotcha (from code): `packages/db/drizzle.config.ts` — uses `dialect: sqlite, driver: d1-http` for Cloudflare D1 access
- Source: https://orm.drizzle.team/docs/get-started-cloudflare

## Lazy visitor cookie minting
- What: Only creating a visitor cookie on the first mutating action, not on reads — prevents bots from polluting the visitor space
- Why here: TBD
- Gotcha (from code): `apps/web/src/lib/visitor.ts:22` — `ensureVisitorId()` only callable in Server Actions, not in page components
- Source: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations

## Token-gated moderation via shared secret
- What: Using a shared secret token to gate moderation actions instead of full auth
- Why here: TBD
- Gotcha (from code): `apps/web/src/lib/moderation.ts:3-9` — `getModerationToken()` checks both Cloudflare env var `RAG_SERVICE_KEY` and `process.env` fallback
- Source: https://developers.cloudflare.com/workers/runtime-apis/env/

## LIMIT 1 probe for existence check
- What: Using `LIMIT 1` instead of `COUNT(*)` to check if any records exist — avoids scanning the full table
- Why here: TBD
- Gotcha (from code): `apps/web/src/lib/ratings.ts:284-292` — `countVisitorRatings` uses `limit(1)` to avoid scanning entire rating history when only checking existence
- Source: https://www.sqlite.org/optoverview.html

## Sparse constraint tags for recommendations
- What: Optional key/value attributes for cross-stack recommender filtering — items without tags simply don't get constraint boosts
- Why here: TBD
- Gotcha (from code): `packages/db/src/schema.ts:93-107` — `itemTags` table is sparse; absence of a tag row means "no constraint", not "false"
- Source: https://en.wikipedia.org/wiki/Sparse_matrix
