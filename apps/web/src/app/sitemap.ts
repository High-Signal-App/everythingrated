import type { MetadataRoute } from "next";

import { listDirectories, listItemsWithAggregates } from "@/lib/ratings";

export const dynamic = "force-dynamic";

const siteUrl = "https://everythingrated.workers.dev";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
  ];

  try {
    const dirs = await listDirectories();
    for (const d of dirs) {
      entries.push({
        url: `${siteUrl}/d/${d.directory.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
      // Enumerate items per directory so search engines can crawl deep.
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
