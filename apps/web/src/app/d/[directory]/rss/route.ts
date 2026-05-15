import { headers } from "next/headers";

import { getDirectoryBySlug, listItemsWithAggregates } from "@/lib/ratings";
import { buildRssXml } from "@/lib/rss";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ directory: string }> },
) {
  const { directory: slug } = await ctx.params;
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost";
  const base = `${proto}://${host}`;

  const directory = await getDirectoryBySlug(slug);
  if (!directory) {
    return new Response("Directory not found", { status: 404 });
  }

  const items = await listItemsWithAggregates(directory.id, null);
  const xml = buildRssXml({
    title: `EverythingRated — ${directory.name}`,
    link: `${base}/d/${directory.slug}`,
    description: `Items in the ${directory.name} directory, with multi-axis aggregate scores.`,
    items: items.map((i) => ({
      title: i.item.name,
      link: `${base}/d/${directory.slug}/${i.item.slug}`,
      guid: `${base}/d/${directory.slug}/${i.item.slug}`,
      pubDate: i.item.createdAt instanceof Date ? i.item.createdAt : new Date(i.item.createdAt),
      description: i.item.description,
    })),
  });

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
