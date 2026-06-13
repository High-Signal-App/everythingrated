# 0004 — Moderated dynamic submissions (product brief)

**Status:** shipped 2026-06-13 (D1 persistence + moderation flow complete for pilot)
**Created:** 2026-06-04  
**Shipped notes:** In-memory queue + fixture prototype replaced with real `item_submissions` table (0002 migration). Lib mirrors directory-submissions pattern. `loadItemSubmissionFixtures()` helper added for seed/dry-runs. UI copy updated. Approve/merge/reject/rollback persist correctly; dups/trust/rate-limits preserved. See `apps/web/src/lib/item-submissions.ts`, moderation page, and migration 0002. Pilot remains `ai-dev-tools` only.
**Source:** [saas-ideas consolidation](https://github.com/sarthakagrawal927/saas-ideas) at `aba1a83`, mapped in `saas-maker/docs/ideas/saas-ideas-consolidation-2026-06-03.md`  
**Depends on:** `0003-directories.md` (shipped), directory moderation queue (shipped 2026-05)

## Problem

EverythingRated's bet is **directory-specific multi-axis ratings**, not another
generic list or tier board. Visitors already rate anonymously; the POC now also
accepts **directory (category) suggestions** via `/submit-directory` with owner
moderation. The next gap is **item suggestions inside an existing directory**
without breaking the anonymous rating loop or opening an unmoderated spam
surface.

The saas-ideas cluster to consolidate:

| Idea from saas-ideas | Fit in EverythingRated | Decision |
| -------------------- | ---------------------- | -------- |
| Directory maker | Category + aspect rubric submission | **Shipped** (`directory_submissions`, `/submit-directory`, `/moderation`) |
| Domain / tool directories | Static + moderated directories | **Keep** — directories stay curated; community proposes, owner approves |
| Collaborative voting on lists | Community reshapes ordering/content | **Defer** — conflicts with fixed aspect rubrics; revisit as submission *endorsement*, not list reorder |
| Tier lists | Rank buckets (S/A/B/…) | **Reject as core UX** — multi-axis scores + `/compare` already express trade-offs; tier view is a derivative export, not a submission primitive |
| Rate-anything variants | Open-ended categories | **Narrow** — one directory at a time, per-directory aspects, moderation gate |

## Product goal

Let anonymous visitors **suggest items to add** in an existing directory. Every
suggestion enters a **moderation queue**. Approved items become rateable; rejected
and duplicate submissions stay auditable. **Rating stays anonymous** and
unchanged — submissions are a separate, slower loop.

### Non-goals (this iteration)

- Full user accounts or OAuth
- Public admin dashboard beyond the existing token-gated `/moderation`
- Dynamic aspect editing on live directories
- Tier-list mode, Reddit-style upvote ranking, or collaborative list editing
- Search, comments, or item owner claims

## What is already shipped (directory / category layer)

Reference implementation to mirror for items:

| Concern | Directory submissions (v1) | Location |
| ------- | -------------------------- | -------- |
| Public form | `/submit-directory` | `directory-submission-form.tsx` |
| Validation | length caps, 3–8 aspects, email optional | `validateDirectorySubmission` |
| Slug dedup | slugify name; block if directory or non-rejected queue row exists | `submitDirectorySuggestion` |
| Moderation | `MODERATION_TOKEN` query param; approve/reject | `/moderation`, `moderateDirectorySubmission` |
| Approve effect | inserts `directories` + `aspects`; empty item list | `approveDirectorySubmission` |
| Rollback | reject updates status + note; no hard delete of approved directories yet | manual / future |

**Gap:** approved directories arrive with **zero items**. Item submission closes
that loop for the flagship directory first.

## Scope — item submissions v1 (one directory pilot)

**Pilot directory:** `ai-dev-tools` only.

Rationale: highest traffic, owner knows the domain, aspects are stable, seed
data is rich enough to test duplicate detection (Cursor, Claude Code, etc.).

### Visitor flow

1. On `/d/ai-dev-tools`, link **"Suggest a tool"** → `/d/ai-dev-tools/submit`.
2. Form fields: **name**, **short description** (≥ 20 chars), **website URL**
   (required, `https://`), optional submitter name/email.
3. Server Action validates, slugifies name, runs duplicate checks, inserts
   `item_submissions` row with `status = pending`.
4. Success copy: *"Thanks — queued for review. You can still rate existing tools
   while we review."* No account created.
5. **Do not mint `er_visitor` on the submit page** unless we need submitter
   identity; prefer minting on submit action only (same pattern as ratings).

### Moderation flow (extend existing surface)

Extend `/moderation?token=…` with a second section **"Item submissions"**
(filterable by directory, default `ai-dev-tools`).

| Action | Effect |
| ------ | ------ |
| **Approve** | Insert into `items` for target directory; set submission `approved`; revalidate directory + new item paths |
| **Reject** | `status = rejected`, optional note; no `items` row |
| **Merge duplicate** | `status = merged`, `merged_into_item_id` set; show link to existing item |

Same **`MODERATION_TOKEN`** gate as today. No new auth system.

### Auth decision

| Capability | Mechanism | Full auth needed? |
| ---------- | --------- | ----------------- |
| Rate items | `er_visitor` cookie, minted on first `submitRating` | **No** |
| Suggest directory | anonymous form + optional email | **No** |
| Suggest item | anonymous form + optional email; optional `submitter_visitor_id` if cookie already exists | **No** |
| Moderate queue | shared secret `MODERATION_TOKEN` in URL | **No** — sufficient for single-owner POC |
| Roll back approved item | owner runs compensating migration or moderation "hide" action | **No** |

**Conclusion:** full auth is **not required** for v1. Revisit accounts only if
(1) submission spam exceeds rate limits, or (2) we need non-owner moderators.

## Schema proposal (v2 migration)

```ts
/** Community item suggestion inside one directory. Pilot: ai-dev-tools only. */
export const itemSubmissions = sqliteTable(
  "item_submissions",
  {
    id: text("id").primaryKey(),
    directoryId: text("directory_id")
      .notNull()
      .references(() => directories.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    websiteUrl: text("website_url").notNull(),
    submitterVisitorId: text("submitter_visitor_id"), // nullable; from er_visitor if present
    submitterName: text("submitter_name"),
    submitterEmail: text("submitter_email"),
    status: text("status").notNull().default("pending"), // pending | approved | rejected | merged
    mergedIntoItemId: text("merged_into_item_id").references(() => items.id, {
      onDelete: "set null",
    }),
    moderatorNote: text("moderator_note"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    moderatedAt: integer("moderated_at", { mode: "timestamp_ms" }),
  },
  (t) => ({
    dirSlugPending: uniqueIndex("item_submissions_dir_slug_active_idx").on(
      t.directoryId,
      t.slug,
    ), // partial unique in app layer: only when status in (pending, approved)
    statusCreated: index("item_submissions_status_created_idx").on(
      t.status,
      t.createdAt,
    ),
  }),
);

/** Optional v1.1 — soft-hide approved items without deleting ratings history */
export const itemsHidden = /* defer until first bad approval */;
```

**Directory gate:** Server Action rejects submissions when
`directory.slug !== "ai-dev-tools"` until pilot validates moderation load.

## Duplicate prevention

Layer checks in order (cheap first):

1. **Exact slug match** within directory against live `items.slug` → block with
   link to existing item (`/d/ai-dev-tools/cursor`).
2. **Exact slug match** against `item_submissions` where
   `status IN ('pending', 'approved')` → block with "already queued".
3. **Normalized name match** — lowercase, strip punctuation, collapse whitespace
   — against items and pending submissions → warn or block (configurable;
   **block** for pilot).
4. **Website URL host match** — parse hostname; if another item in directory
   shares host (e.g. `cursor.com` vs `www.cursor.com`) → flag for moderator as
   likely duplicate, auto-`merge` suggestion in UI.
5. **Rejected resubmit cooldown** — same slug resubmit within 7 days → block
   unless moderator cleared rejection (optional v1.1).

Directory layer already implements (1)–(2) for categories; item layer mirrors
that pattern in `apps/web/src/lib/directory-submissions.ts`.

## Trust signals (no accounts)

Display to moderator only — not public reputation scores.

| Signal | Source | Use |
| ------ | ------ | --- |
| Submitter history | count prior `approved` submissions by `submitter_visitor_id` or email | badge: "trusted submitter" if ≥ 2 approvals |
| URL plausibility | `https://` required; HEAD or GET with timeout; 2xx/3xx = pass | flag broken links before approve |
| Domain alignment | hostname tokens vs slug/name (e.g. `cursor.com` + "Cursor") | flag mismatch |
| Rate limit | max 3 pending submissions per visitor per directory per 24h | block spam |
| Duplicate confidence | normalized name + host match score | pre-select "Merge" action |

**Explicitly not in v1:** verified ownership, karma, public voter queues, or
tier-list reshuffling from votes.

## Rollback

Follow `docs/migrations.md`: D1 migrations are forward-only.

| Scenario | Rollback path |
| -------- | ------------- |
| Pending submission wrong | Reject — no public surface touched |
| Approved item wrong, **no ratings yet** | Moderator "Hide item" (v1.1) or manual SQL delete of `items` row + set submission `rejected` with note |
| Approved item wrong, **has ratings** | **Do not hard-delete.** Add `items.hidden_at` (v1.1) or compensating migration setting a `hidden` flag; exclude from directory grid; keep ratings for audit |
| Bad directory approval | Manual: delete directory if zero items/ratings; otherwise hide and stop promoting |
| Schema mistake | New compensating migration; restore from `wrangler d1 export` backup taken pre-migrate |

Every approve/reject writes `moderator_note` + `moderated_at` for audit.

## Seed examples — `ai-dev-tools` pilot only

Concrete fixture set for tests and local moderation dry-runs. File:
`fixtures/item-submissions-ai-dev-tools.json`.

| id | name | expected outcome | why |
| -- | ---- | ---------------- | --- |
| `sub-cursor-dup` | Cursor | **reject / merge** | duplicates seeded item `cursor` |
| `sub-cursor-alt` | Cursor IDE | **merge** | normalized name duplicate |
| `sub-zed-new` | Zed | **approve** | legitimate missing editor |
| `sub-fake-ai` | Totally Real AI Coder | **reject** | spam name; broken URL `https://example.invalid` |
| `sub-continue-conflict` | Continue Dev | **merge** | host/name overlap with seeded `continue` |
| `sub-warp-new` | Warp | **approve** | valid new terminal editor |

Example row (approve case):

```json
{
  "id": "sub-zed-new",
  "directorySlug": "ai-dev-tools",
  "slug": "zed",
  "name": "Zed",
  "description": "High-performance multiplayer code editor from the Atom team.",
  "websiteUrl": "https://zed.dev",
  "submitterName": "Alex",
  "submitterEmail": "alex@example.com",
  "status": "pending"
}
```

After approval, directory item count for `ai-dev-tools` rises from 10 → 11 with
**no aspect changes** and **zero initial ratings** (same as seed items before
owner ratings).

## Tests and fixtures required before implementation

Do not ship item submission UI until these pass.

### Unit tests (`apps/web/src/lib/item-submissions.test.ts`)

Mirror `directory-submissions.test.ts` style (Node `assert`, no test runner deps):

- `slugifyItemName` — punctuation, length cap 60, empty collapse
- `normalizeWebsiteUrl` — require `https://`, strip trailing slash, reject non-URLs
- `validateItemSubmission` — min description length, field caps, optional email
- `detectDuplicateSlug` — blocks existing item + pending submission
- `detectDuplicateName` — case/punctuation insensitive match
- `detectDuplicateHost` — `www.` normalization

### Integration tests (D1 local or in-memory stub)

Using `fixtures/item-submissions-ai-dev-tools.json`:

1. **submit** each fixture into local D1 → assert expected validation errors for dup/spam
2. **approve** `sub-zed-new` → item appears in `listItemsWithAggregates(ai-dev-tools)`
3. **merge** `sub-cursor-dup` → no new item; submission status `merged`
4. **reject** `sub-fake-ai` → status `rejected`; directory item count unchanged
5. **idempotent approve** — second approve call on same id fails

### Moderation contract tests

- `/moderation` without token → 404
- wrong token → 404
- approve invalid id → error query param, no partial insert

### Fixture loading

```bash
# proposed command (implement with seed script)
pnpm fixtures:load:item-submissions --local
```

Loads `fixtures/item-submissions-ai-dev-tools.json` into `item_submissions` only;
does not mutate seeded `items`.

### Manual QA checklist

- [ ] Suggest tool on mobile width
- [ ] Duplicate submit shows link to existing item
- [ ] Approved item page accepts ratings with existing `RateRow` UX
- [ ] `er_visitor` still minted only on rating, not on directory browse

## UX notes — saas-ideas ideas reframed

- **Collaborative voting:** if added later, apply only to *pending submissions*
  ("I want this tool too" counter), not to reordering live scores.
- **Tier list:** export compare-board results as shareable image/text; not a
  submission or rating input method.
- **Directory maker:** stay separate from item submission; do not let visitors
  pick arbitrary aspects when suggesting a tool.

## Implementation sequence (suggested)

1. Migration + `item-submissions.ts` lib + unit tests + fixture loader
2. `/d/[directory]/submit` page gated to `ai-dev-tools`
3. Extend `/moderation` with item queue + merge action
4. Rate limit binding on submit action (reuse `RATE_LIMITER` if wired)
5. Expand to `databases` / `hosting` only after ≥ 20 moderated item decisions
   on ai-dev-tools without spam incident

## Open questions

1. **Auto-approve for trusted submitters?** Defer — manual moderation only until queue > 10/week.
2. **Logo on approve?** Defer — approved items render without `logo_url` until owner adds seed entry.
3. **Notify submitter on approve?** Optional email if provided; no email infra in POC — skip until transactional email exists.

## Files to touch (implementation task, not this brief)

- `packages/db/src/schema.ts` + migration
- `apps/web/src/lib/item-submissions.ts` + `.test.ts`
- `apps/web/src/lib/actions.ts` — `submitItem`, `moderateItemSubmission`
- `apps/web/src/app/d/[directory]/submit/page.tsx`
- `apps/web/src/app/moderation/page.tsx`
- `fixtures/item-submissions-ai-dev-tools.json`
- `scripts/load-item-submission-fixtures.ts` (or extend `seed-d1.ts`)
- `CHANGELOG.md` — behavioural entry on ship
