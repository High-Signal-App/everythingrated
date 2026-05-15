import { NextResponse } from "next/server";

import { getDirectoryBySlug, listItemsWithAggregates } from "@/lib/ratings";

export const dynamic = "force-dynamic";

/**
 * Public JSON export of a directory's items + aspect aggregates. Use to
 * power custom dashboards, archives, or third-party analyses.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ directory: string }> },
) {
  const { directory: slug } = await ctx.params;
  const directory = await getDirectoryBySlug(slug);
  if (!directory) {
    return NextResponse.json({ error: "directory_not_found" }, { status: 404 });
  }

  // Pass null visitor — exports are anonymous; per-visitor scores aren't included.
  const items = await listItemsWithAggregates(directory.id, null);

  return NextResponse.json(
    {
      directory,
      items,
      generatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
