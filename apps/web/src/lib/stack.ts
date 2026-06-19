/**
 * Data layer for the cross-stack recommender: pulls the rated catalogue for a
 * set of directories out of D1, aggregates per-item aspect averages + tags,
 * and runs the pure {@link recommendStack} scorer over it.
 *
 * Mirrors lib/ratings.ts style: full pulls + JS reduce, fine at POC scale.
 * Only the requested directories' items are aggregated.
 */

import { aspects, directories, items, itemTags, ratings } from "@everythingrated/db";
import { getDb } from "./db";
import {
  recommendStack,
  type Catalogue,
  type CatalogueAspect,
  type CatalogueItem,
  type StackResult,
} from "./stack-recommender";
import type { ConstraintTag, StackIntent } from "./stack-vocabulary";

/** Build a {@link Catalogue} containing only the requested directories. */
export async function loadCatalogue(directorySlugs: string[]): Promise<Catalogue> {
  const slugSet = new Set(directorySlugs);
  if (slugSet.size === 0) return { directories: [] };

  const db = await getDb();
  const allDirs = await db.select().from(directories);
  const wantedDirs = allDirs.filter((d) => slugSet.has(d.slug));
  if (wantedDirs.length === 0) return { directories: [] };

  const wantedDirIds = new Set(wantedDirs.map((d) => d.id));
  const [allItems, allAspects, allRatings, allTags] = await Promise.all([
    db.select().from(items),
    db.select().from(aspects),
    db.select().from(ratings),
    db.select().from(itemTags),
  ]);

  const dirItems = allItems.filter((i) => wantedDirIds.has(i.directoryId));
  const itemIds = new Set(dirItems.map((i) => i.id));

  // Current (non-superseded) ratings for the items in scope.
  const currentRatings = allRatings.filter(
    (r) => itemIds.has(r.itemId) && r.supersededAt == null,
  );

  // aspectId -> {sum, raters} per item.
  const aggKey = (itemId: string, aspectId: string) => `${itemId}::${aspectId}`;
  const agg = new Map<string, { sum: number; count: number }>();
  for (const r of currentRatings) {
    const k = aggKey(r.itemId, r.aspectId);
    const e = agg.get(k) ?? { sum: 0, count: 0 };
    e.sum += r.score;
    e.count += 1;
    agg.set(k, e);
  }

  // distinct raters per item (across all aspects).
  const ratersByItem = new Map<string, Set<string>>();
  for (const r of currentRatings) {
    const s = ratersByItem.get(r.itemId) ?? new Set<string>();
    s.add(r.visitorId);
    ratersByItem.set(r.itemId, s);
  }

  // tags per item.
  const tagsByItem = new Map<string, ConstraintTag[]>();
  for (const t of allTags) {
    if (!itemIds.has(t.itemId)) continue;
    const list = tagsByItem.get(t.itemId) ?? [];
    list.push({ key: t.key, value: t.value });
    tagsByItem.set(t.itemId, list);
  }

  const aspectsByDir = new Map<string, typeof allAspects>();
  for (const a of allAspects) {
    if (!wantedDirIds.has(a.directoryId)) continue;
    const list = aspectsByDir.get(a.directoryId) ?? [];
    list.push(a);
    aspectsByDir.set(a.directoryId, list);
  }

  const dirById = new Map(wantedDirs.map((d) => [d.id, d]));

  const catalogueDirs = wantedDirs
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((dir) => {
      const dirAspects = (aspectsByDir.get(dir.id) ?? []).sort(
        (a, b) => a.sortOrder - b.sortOrder,
      );
      const catItems: CatalogueItem[] = dirItems
        .filter((i) => i.directoryId === dir.id)
        .map((item) => {
          const aspectAverages: CatalogueAspect[] = dirAspects.map((a) => {
            const e = agg.get(aggKey(item.id, a.id));
            return {
              key: a.key,
              label: a.label,
              avg: e && e.count > 0 ? e.sum / e.count : 0,
              count: e?.count ?? 0,
            };
          });
          return {
            id: item.id,
            slug: item.slug,
            name: item.name,
            description: item.description,
            websiteUrl: item.websiteUrl,
            logoUrl: item.logoUrl,
            directorySlug: dir.slug,
            directoryName: dir.name,
            aspects: aspectAverages,
            totalRaters: ratersByItem.get(item.id)?.size ?? 0,
            tags: tagsByItem.get(item.id) ?? [],
          };
        });
      return { slug: dir.slug, name: dir.name, items: catItems };
    });

  return { directories: catalogueDirs };
}

/** Load the catalogue for the intent's directories and produce a ranked stack. */
export async function buildStackResult(intent: StackIntent): Promise<StackResult> {
  const catalogue = await loadCatalogue(intent.directories);
  return recommendStack(catalogue, intent);
}
