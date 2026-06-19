/**
 * Free-text → structured {@link StackIntent}, deterministically.
 *
 * Tokenises the prose and matches it against the controlled vocabulary in
 * `stack-vocabulary.ts`. Multi-word phrases match as substrings of the
 * normalised text; single words match on token boundaries (so "go" the
 * language doesn't fire on "google"). No model, no network — this is the
 * always-on path the hybrid UI pre-fills its chips from.
 */

import {
  ASPECT_SIGNALS,
  CONSTRAINT_SIGNALS,
  DIRECTORY_SIGNALS,
  type ConstraintTag,
  type StackIntent,
} from "./stack-vocabulary";

/** Weight applied to an aspect group the user emphasised (1 = neutral). */
export const EMPHASIS_WEIGHT = 2.5;

function normalize(text: string): string {
  return ` ${text.toLowerCase().replace(/[^a-z0-9.+/#-]+/g, " ").replace(/\s+/g, " ").trim()} `;
}

/** True if `keyword` appears in `normalized` (already space-padded, lowercased). */
function matches(normalized: string, keyword: string): boolean {
  const k = keyword.toLowerCase().trim();
  if (k.includes(" ")) {
    // Phrase: plain substring is fine, the text is normalised.
    return normalized.includes(` ${k} `) || normalized.includes(`${k} `) || normalized.includes(` ${k}`);
  }
  // Single token: require word boundaries to avoid "go" ⊂ "google".
  return normalized.includes(` ${k} `);
}

function tagKey(t: ConstraintTag): string {
  return `${t.key}=${t.value}`;
}

/**
 * Interpret a free-text project description into a {@link StackIntent}.
 * Returns empty arrays/maps when nothing matches — the caller decides how to
 * prompt for more detail.
 */
export function interpretQuery(text: string): StackIntent {
  const normalized = normalize(text ?? "");
  if (normalized.trim().length === 0) {
    return { directories: [], weights: {}, tags: [] };
  }

  const directories: string[] = [];
  for (const dir of DIRECTORY_SIGNALS) {
    if (dir.keywords.some((kw) => matches(normalized, kw))) {
      directories.push(dir.slug);
    }
  }

  const weights: Record<string, number> = {};
  const emphasise = (aspectKeys: string[]) => {
    for (const key of aspectKeys) {
      weights[key] = Math.max(weights[key] ?? 1, EMPHASIS_WEIGHT);
    }
  };

  for (const aspect of ASPECT_SIGNALS) {
    if (aspect.keywords.some((kw) => matches(normalized, kw))) {
      emphasise(aspect.aspectKeys);
    }
  }

  const tags: ConstraintTag[] = [];
  const seenTags = new Set<string>();
  for (const c of CONSTRAINT_SIGNALS) {
    if (c.keywords.some((kw) => matches(normalized, kw))) {
      if (!seenTags.has(tagKey(c.tag))) {
        seenTags.add(tagKey(c.tag));
        tags.push(c.tag);
      }
      if (c.boostsAspects) emphasise(c.boostsAspects);
    }
  }

  return { directories, weights, tags };
}

/**
 * Overlay explicit user choices (chips the user toggled) onto a base intent.
 * Each provided field replaces the base field; omitted fields fall through.
 * Lets the hybrid UI start from `interpretQuery` then honour manual edits.
 */
export function mergeIntent(
  base: StackIntent,
  override: Partial<StackIntent>,
): StackIntent {
  return {
    directories: override.directories ?? base.directories,
    weights: override.weights ?? base.weights,
    tags: override.tags ?? base.tags,
  };
}

/** Expand an aspect-emphasis group id (e.g. "speed") into a weights patch. */
export function weightsForAspectGroups(groupIds: string[]): Record<string, number> {
  const weights: Record<string, number> = {};
  for (const id of groupIds) {
    const group = ASPECT_SIGNALS.find((a) => a.id === id);
    if (!group) continue;
    for (const key of group.aspectKeys) weights[key] = EMPHASIS_WEIGHT;
  }
  return weights;
}
