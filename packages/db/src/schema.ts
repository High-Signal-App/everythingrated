import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// ─────────────────────────────────────────────
// EverythingRated — multi-axis ratings
// ─────────────────────────────────────────────

/** A directory: a self-contained collection of rateable things with its own aspects. */
export const directories = sqliteTable("directories", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  heroCopy: text("hero_copy").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

/** A rateable thing inside a directory. Slug is unique per directory. */
export const items = sqliteTable(
  "items",
  {
    id: text("id").primaryKey(),
    directoryId: text("directory_id")
      .notNull()
      .references(() => directories.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    websiteUrl: text("website_url").notNull(),
    logoUrl: text("logo_url"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    dirSlug: uniqueIndex("items_directory_slug_idx").on(t.directoryId, t.slug),
  }),
);

/** A rating axis scoped to one directory. Key is unique per directory. */
export const aspects = sqliteTable(
  "aspects",
  {
    id: text("id").primaryKey(),
    directoryId: text("directory_id")
      .notNull()
      .references(() => directories.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    label: text("label").notNull(),
    description: text("description").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => ({
    dirKey: uniqueIndex("aspects_directory_key_idx").on(t.directoryId, t.key),
  }),
);

// NEW in 0001 — sparse release timeline per item for anchoring ratings to versions.
// Items with no rows fall back to date-only.
export const itemVersions = sqliteTable(
  "item_versions",
  {
    id: text("id").primaryKey(),
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    version: text("version").notNull(), // e.g. "0.45", "1.0", "Sonnet 4.5"
    releasedAt: integer("released_at", { mode: "timestamp_ms" }).notNull(),
    note: text("note"), // optional changelog blurb
  },
  (t) => ({
    uniq: uniqueIndex("item_versions_item_version_idx").on(t.itemId, t.version),
    byDate: index("item_versions_item_released_idx").on(t.itemId, t.releasedAt),
  }),
);

/**
 * Constraint tags on an item (0004 — stack recommender).
 * Key/value attributes the cross-stack recommender filters and boosts on,
 * e.g. ("runs-on","cloudflare"), ("pricing","free-tier"), ("self-hostable","yes").
 * Sparse: items with no tags simply don't get constraint boosts. Unique per
 * (item, key, value) so re-seeding is idempotent.
 */
export const itemTags = sqliteTable(
  "item_tags",
  {
    id: text("id").primaryKey(),
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    key: text("key").notNull(), // e.g. "runs-on", "pricing", "self-hostable", "language"
    value: text("value").notNull(), // e.g. "cloudflare", "free-tier", "yes", "typescript"
  },
  (t) => ({
    uniq: uniqueIndex("item_tags_item_key_value_idx").on(t.itemId, t.key, t.value),
    byKeyValue: index("item_tags_key_value_idx").on(t.key, t.value),
  }),
);

/**
 * Ratings are append-only history (0001).
 * Re-rating supersedes the prior row for the same (visitor, item, aspect) by setting supersededAt.
 * versionId (nullable) anchors to an item_version when available (auto-derived or explicit).
 * Aggregations for "current" view exclude rows where supersededAt IS NOT NULL.
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
    versionId: text("version_id").references(() => itemVersions.id, { onDelete: "set null" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    // Set on re-rate for same (visitor,item,aspect); old row kept for history/trends.
    supersededAt: integer("superseded_at", { mode: "timestamp_ms" }),
  },
  (t) => ({
    // Hot path: aggregate one item's ratings within a time window.
    byItemTime: index("ratings_item_time_idx").on(t.itemId, t.createdAt),
    // Hot path: per-aspect window aggregations.
    byAspectTime: index("ratings_item_aspect_time_idx").on(t.itemId, t.aspectId, t.createdAt),
    // Find a visitor's current (non-superseded) row for "your score".
    byVisitor: index("ratings_visitor_idx").on(t.visitorId, t.itemId, t.aspectId),
    // Partial-style index for the "current view" aggregations that filter
    // supersededAt IS NULL scoped to (item, aspect). Backs the WHERE
    // inArray(itemId, ...) + isNull(supersededAt) queries in ratings.ts.
    superseded: index("ratings_superseded_idx").on(t.itemId, t.aspectId, t.supersededAt),
  }),
);

/** Community directory suggestions queued for owner moderation. */
export const directorySubmissions = sqliteTable(
  "directory_submissions",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    heroCopy: text("hero_copy").notNull(),
    aspectLabels: text("aspect_labels").notNull(),
    submitterName: text("submitter_name"),
    submitterEmail: text("submitter_email"),
    status: text("status").notNull().default("pending"),
    moderatorNote: text("moderator_note"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    moderatedAt: integer("moderated_at", { mode: "timestamp_ms" }),
  },
  (t) => ({
    statusCreated: index("directory_submissions_status_created_idx").on(
      t.status,
      t.createdAt,
    ),
  }),
);

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
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
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
    // Lookups of submissions by directory (moderation queue filtered per dir).
    byDirectory: index("item_submissions_directory_idx").on(t.directoryId),
  }),
);

export type Directory = typeof directories.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Aspect = typeof aspects.$inferSelect;
export type Rating = typeof ratings.$inferSelect;
export type DirectorySubmission = typeof directorySubmissions.$inferSelect;
export type ItemSubmission = typeof itemSubmissions.$inferSelect;
export type ItemVersion = typeof itemVersions.$inferSelect;
export type ItemTag = typeof itemTags.$inferSelect;
