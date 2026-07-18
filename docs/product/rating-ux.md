# Rating UX

## The core loop

1. Visitor opens `/d/[directory]/[item]`.
2. The page renders the directory's aspect rubric and, for each aspect, a
   `RateRow` showing the current average, the rater count, and the visitor's
   own score (if any).
3. The visitor taps one of five buttons (**1–5**) per aspect. `RateRow`
   updates **optimistically**:
   the displayed average and "your score" change immediately, then the
   `submitRating` Server Action is awaited.
4. On success, `revalidatePath` refreshes the authoritative server view.

## Why optimistic

Ratings are the entire product. Waiting on a round-trip before reflecting a
score feels broken; the optimistic update makes the interaction feel instant
while the Server Action persists the truth. The server revalidation is the
convergence step — if the optimistic guess was wrong (e.g. a concurrent rate),
the next render corrects it.

## Identity

- The `er_visitor` cookie is httpOnly, SameSite=Lax, 1 year.
- It is **minted lazily** on the first `submitRating` call (a Server Action),
  never on read pages. This keeps page renders cacheable and prevents bots
  and crawlers from polluting the visitor space.
- `readVisitorId()` is safe in Server Components; `ensureVisitorId()` is only
  callable in Server Actions / Route Handlers. See
  `apps/web/src/lib/visitor.ts`.

## One score per axis per visitor

`(item_id, aspect_id, visitor_id)` is unique in the historical sense: re-rating
**supersedes** the prior row rather than overwriting it. The old row is kept
with `supersededAt` set; current-view aggregates filter `supersededAt IS NULL`.
See [architecture/ratings-pipeline.md](../architecture/ratings-pipeline.md).

## Aggregation

- Per-item, per-aspect averages and rater counts are computed in
  `apps/web/src/lib/ratings.ts` via a directory-scoped pull + JS reduce.
- This is fine at POC scale. If a directory grows, move aggregation into SQL
  `AVG` / `GROUP BY` against the `ratings_superseded_idx` partial-style index.
- Scores are on a **1–5** scale end to end (`RateRow` buttons, clamped in
  `rate()`); averages and comparison totals stay on that scale.
- Comparison boards weight each aspect by a user-tunable 0–5 weight
  (`?w=key:value,...`), normalized by total weight (a weighted mean) so totals
  stay on the same **1–5** scale as the inputs. Weights default to 1; encoding
  drops any weight equal to 1 to keep shareable URLs short. Sort tie-breaks
  alphabetically on `item.name`.

## Confidence

A rating confidence explainer is rendered on the homepage (`app/page.tsx`) so
visitors understand that a high average from two raters who disagree is not the
same as one from two dozen who agree (the copy uses "a 4.3 from two dozen
raters" — a 1–5 value). The explainer is copy, not a statistical model — keep
it honest about small-n.
