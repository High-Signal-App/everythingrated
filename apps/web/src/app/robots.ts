import type { MetadataRoute } from "next";

import { SITE_ORIGIN } from "@/lib/public-surfaces";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/ai"],
        disallow: [
          "/api/",
          "/moderation",
          "/my",
          "/submit-directory",
          "/d/*/submit",
        ],
      },
    ],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
