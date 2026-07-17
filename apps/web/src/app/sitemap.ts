import type { MetadataRoute } from "next";

import { listDirectories, listItemsWithAggregates } from "@/lib/ratings";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

/** Public production origin (not workers.dev). */
const siteUrl = "https://ratings.highsignal.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${siteUrl}/llms.txt`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/index.md`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.4,
    },
  ];

  try {
    const dirs = await listDirectories();
    // Include every directory + item so crawlers discover the full catalog.
    // Parked directories remain public at direct URLs (see directory-focus.ts).
    for (const d of dirs) {
      entries.push({
        url: `${siteUrl}/d/${d.directory.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
      const items = await listItemsWithAggregates(d.directory.id, null);
      for (const i of items) {
        entries.push({
          url: `${siteUrl}/d/${d.directory.slug}/${i.item.slug}`,
          lastModified:
            i.item.createdAt instanceof Date
              ? i.item.createdAt
              : new Date(i.item.createdAt),
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    }
  } catch {
    /* DB offline — return static-only sitemap. */
  }

  return entries;
}
