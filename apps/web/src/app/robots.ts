import type { MetadataRoute } from "next";

const siteUrl = "https://everythingrated.workers.dev";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/moderation", "/submit-directory"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
