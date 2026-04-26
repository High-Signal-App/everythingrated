import { items, aspects, ratings, type Aspect, type Item } from "@everythingrated/db";
import { eq } from "drizzle-orm";
import { getDb } from "./db";

export type AspectAverage = {
  aspect: Aspect;
  avg: number; // 0 if no ratings yet
  count: number;
  yourScore: number | null;
};

export type ItemWithAggregate = {
  item: Item;
  aspects: AspectAverage[];
  overall: number; // mean of aspect avgs (excluding aspects with no ratings)
  totalRaters: number; // distinct visitor ids across all aspects for this item
};

/** Load all aspects in display order. */
export async function listAspects(): Promise<Aspect[]> {
  const db = await getDb();
  return db.select().from(aspects).orderBy(aspects.sortOrder);
}

/** Aggregate every item with its per-aspect averages and the visitor's own scores. */
export async function listItemsWithAggregates(
  visitorId: string | null,
): Promise<ItemWithAggregate[]> {
  const db = await getDb();
  const [allItems, allAspects, allRatings] = await Promise.all([
    db.select().from(items).orderBy(items.name),
    db.select().from(aspects).orderBy(aspects.sortOrder),
    db.select().from(ratings),
  ]);

  return allItems.map((item) => buildAggregate(item, allAspects, allRatings, visitorId));
}

/** Single item by slug — null if not found. */
export async function getItemAggregate(
  slug: string,
  visitorId: string | null,
): Promise<ItemWithAggregate | null> {
  const db = await getDb();
  const [item] = await db.select().from(items).where(eq(items.slug, slug));
  if (!item) return null;
  const [allAspects, itemRatings] = await Promise.all([
    db.select().from(aspects).orderBy(aspects.sortOrder),
    db.select().from(ratings).where(eq(ratings.itemId, item.id)),
  ]);
  return buildAggregate(item, allAspects, itemRatings, visitorId);
}

/** Upsert a rating from the given visitor. Score is clamped to 1..5. */
export async function rate(opts: {
  itemId: string;
  aspectId: string;
  visitorId: string;
  score: number;
}): Promise<void> {
  const score = Math.max(1, Math.min(5, Math.round(opts.score)));
  const db = await getDb();
  await db
    .insert(ratings)
    .values({
      id: crypto.randomUUID(),
      itemId: opts.itemId,
      aspectId: opts.aspectId,
      visitorId: opts.visitorId,
      score,
    })
    .onConflictDoUpdate({
      target: [ratings.itemId, ratings.aspectId, ratings.visitorId],
      set: { score },
    });
}

// ─────────── internal ───────────

function buildAggregate(
  item: Item,
  allAspects: Aspect[],
  allRatings: { itemId: string; aspectId: string; visitorId: string; score: number }[],
  visitorId: string | null,
): ItemWithAggregate {
  const itemRatings = allRatings.filter((r) => r.itemId === item.id);

  const perAspect: AspectAverage[] = allAspects.map((aspect) => {
    const rs = itemRatings.filter((r) => r.aspectId === aspect.id);
    const avg = rs.length ? rs.reduce((s, r) => s + r.score, 0) / rs.length : 0;
    const yourScore =
      visitorId !== null
        ? (rs.find((r) => r.visitorId === visitorId)?.score ?? null)
        : null;
    return { aspect, avg, count: rs.length, yourScore };
  });

  const rated = perAspect.filter((a) => a.count > 0);
  const overall = rated.length
    ? rated.reduce((s, a) => s + a.avg, 0) / rated.length
    : 0;

  const totalRaters = new Set(itemRatings.map((r) => r.visitorId)).size;

  return { item, aspects: perAspect, overall, totalRaters };
}
