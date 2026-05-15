import type { MetadataRoute } from "next";

import { listDirectories } from "@/lib/ratings";

export const dynamic = "force-dynamic";

const siteUrl = "https://everythingrated.workers.dev";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
  ];

  let directoryEntries: MetadataRoute.Sitemap = [];
  try {
    const dirs = await listDirectories();
    directoryEntries = dirs.map((d) => ({
      url: `${siteUrl}/d/${d.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    /* DB offline — return static-only sitemap. */
  }

  return [...staticRoutes, ...directoryEntries];
}
