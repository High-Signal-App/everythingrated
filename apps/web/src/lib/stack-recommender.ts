/**
 * Cross-stack recommender (v1: best-in-each-directory under shared constraints).
 *
 * Given a {@link StackIntent} and the rated catalogue, rank items inside each
 * relevant directory by a weighted average of their aspect scores, nudged by
 * how many of the user's constraint tags they satisfy. Returns one pick (plus
 * a couple of alternatives) per directory — a coherent stack assembled from
 * the best-rated thing in each category the user needs.
 *
 * This is NOT a claim that the picks are battle-tested *together* — that needs
 * co-occurrence data we don't have. It's "best in each, filtered by what you
 * told us." All pure functions; see stack-recommender.test.ts.
 */

import type { ConstraintTag, StackIntent } from "./stack-vocabulary";

/** Per-aspect average for one item (already aggregated from ratings). */
export type CatalogueAspect = {
  key: string;
  label: string;
  avg: number; // 0 if unrated
  count: number;
};

export type CatalogueItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  websiteUrl: string;
  logoUrl: string | null;
  directorySlug: string;
  directoryName: string;
  aspects: CatalogueAspect[];
  totalRaters: number;
  tags: ConstraintTag[];
};

export type Catalogue = {
  directories: Array<{ slug: string; name: string; items: CatalogueItem[] }>;
};

export type ScoredCandidate = {
  item: CatalogueItem;
  /** Weighted aspect mean, 0–5 (before tag adjustment). */
  base: number;
  /** base after constraint-tag boost. */
  score: number;
  matchedTags: ConstraintTag[];
  missingTags: ConstraintTag[];
  /** Aspect keys that contributed most, for the "why" line. */
  topAspects: Array<{ key: string; label: string; avg: number; weight: number }>;
};

export type StackPick = {
  directorySlug: string;
  directoryName: string;
  top: ScoredCandidate;
  alternatives: ScoredCandidate[];
};

export type StackResult = {
  picks: StackPick[];
  /** Directories asked for but absent from the catalogue. */
  unknownDirectories: string[];
  intent: StackIntent;
};

/** Each satisfied constraint tag multiplies the base score by (1 + this). */
export const TAG_BOOST = 0.15;

const ALTERNATIVES_PER_DIRECTORY = 2;

function tagKey(t: ConstraintTag): string {
  return `${t.key}=${t.value}`;
}

/** Weighted mean of an item's *rated* aspects using the intent weights. */
function scoreAspects(
  item: CatalogueItem,
  weights: Record<string, number>,
): { base: number; topAspects: ScoredCandidate["topAspects"] } {
  const contributions = item.aspects
    .filter((a) => a.count > 0)
    .map((a) => {
      const weight = Math.max(0, weights[a.key] ?? 1);
      return { key: a.key, label: a.label, avg: a.avg, weight, weighted: a.avg * weight };
    });

  const totalWeight = contributions.reduce((s, c) => s + c.weight, 0);
  const base = totalWeight > 0
    ? contributions.reduce((s, c) => s + c.weighted, 0) / totalWeight
    : 0;

  // "Why": aspects the user emphasised (weight > 1) that this item scores well on.
  const topAspects = contributions
    .filter((c) => c.weight > 1)
    .sort((a, b) => b.weighted - a.weighted)
    .slice(0, 2)
    .map(({ key, label, avg, weight }) => ({ key, label, avg, weight }));

  return { base, topAspects };
}

function scoreCandidate(item: CatalogueItem, intent: StackIntent): ScoredCandidate {
  const { base, topAspects } = scoreAspects(item, intent.weights);

  const itemTagKeys = new Set(item.tags.map(tagKey));
  const matchedTags = intent.tags.filter((t) => itemTagKeys.has(tagKey(t)));
  const missingTags = intent.tags.filter((t) => !itemTagKeys.has(tagKey(t)));

  const score = base * (1 + TAG_BOOST * matchedTags.length);

  return { item, base, score, matchedTags, missingTags, topAspects };
}

function rankDirectory(
  dir: { slug: string; name: string; items: CatalogueItem[] },
  intent: StackIntent,
): StackPick | null {
  if (dir.items.length === 0) return null;

  const ranked = dir.items
    .map((item) => scoreCandidate(item, intent))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.matchedTags.length - a.matchedTags.length ||
        b.item.totalRaters - a.item.totalRaters ||
        a.item.name.localeCompare(b.item.name),
    );

  return {
    directorySlug: dir.slug,
    directoryName: dir.name,
    top: ranked[0],
    alternatives: ranked.slice(1, 1 + ALTERNATIVES_PER_DIRECTORY),
  };
}

/**
 * Assemble a recommended stack. Picks preserve the order of `intent.directories`
 * so the bundle reads the way the user described their project.
 */
export function recommendStack(catalogue: Catalogue, intent: StackIntent): StackResult {
  const bySlug = new Map(catalogue.directories.map((d) => [d.slug, d]));
  const picks: StackPick[] = [];
  const unknownDirectories: string[] = [];

  for (const slug of intent.directories) {
    const dir = bySlug.get(slug);
    if (!dir) {
      unknownDirectories.push(slug);
      continue;
    }
    const pick = rankDirectory(dir, intent);
    if (pick) picks.push(pick);
  }

  return { picks, unknownDirectories, intent };
}
