import type { MetadataRoute } from "next";

import {
  PUBLIC_STATIC_SURFACES,
  SITE_ORIGIN,
} from "@/lib/public-surfaces";
import { listDirectories, listItemsWithAggregates } from "@/lib/ratings";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = PUBLIC_STATIC_SURFACES.map(
    (surface) => ({
      url: `${SITE_ORIGIN}${surface.path}`,
      lastModified: now,
      changeFrequency: surface.changeFrequency,
      priority: surface.priority,
    }),
  );

  try {
    const dirs = await listDirectories();
    // Include every directory + item so crawlers discover the full catalog.
    // Parked directories remain public at direct URLs (see directory-focus.ts).
    for (const d of dirs) {
      entries.push({
        url: `${SITE_ORIGIN}/d/${d.directory.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
      const items = await listItemsWithAggregates(d.directory.id, null);
      for (const i of items) {
        entries.push({
          url: `${SITE_ORIGIN}/d/${d.directory.slug}/${i.item.slug}`,
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
