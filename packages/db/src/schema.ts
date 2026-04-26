import { sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// ─────────────────────────────────────────────
// EverythingRated — multi-axis ratings POC
// ─────────────────────────────────────────────

/** A rateable thing (AI dev tool in the POC). */
export const items = sqliteTable("items", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  websiteUrl: text("website_url").notNull(),
  logoUrl: text("logo_url"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

/** A rating axis (speed, accuracy, etc.). Shared across items. */
export const aspects = sqliteTable("aspects", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

/**
 * One rating per (item, aspect, visitor). Re-rating upserts.
 * `visitorId` comes from the `er_visitor` cookie (anonymous UUID).
 */
export const ratings = sqliteTable(
  "ratings",
  {
    id: text("id").primaryKey(),
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    aspectId: text("aspect_id")
      .notNull()
      .references(() => aspects.id, { onDelete: "cascade" }),
    visitorId: text("visitor_id").notNull(),
    score: integer("score").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    uniq: uniqueIndex("ratings_item_aspect_visitor_idx").on(
      t.itemId,
      t.aspectId,
      t.visitorId,
    ),
  }),
);

export type Item = typeof items.$inferSelect;
export type Aspect = typeof aspects.$inferSelect;
export type Rating = typeof ratings.$inferSelect;
