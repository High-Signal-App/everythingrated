/** Tiny RSS 2.0 builder — dependency-free, suitable for edge runtime. */

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export interface RssItem {
  title: string;
  link: string;
  guid: string;
  description: string;
  pubDate: Date;
}

export interface RssFeed {
  title: string;
  link: string;
  description: string;
  items: RssItem[];
  lastBuildDate?: Date;
}

export function buildRssXml(feed: RssFeed): string {
  const last = feed.lastBuildDate ?? new Date();
  const items = feed.items
    .map(
      (i) =>
        `    <item>
      <title>${escapeXml(i.title)}</title>
      <link>${escapeXml(i.link)}</link>
      <guid isPermaLink="true">${escapeXml(i.guid)}</guid>
      <pubDate>${i.pubDate.toUTCString()}</pubDate>
      <description>${escapeXml(i.description)}</description>
    </item>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(feed.title)}</title>
    <link>${escapeXml(feed.link)}</link>
    <description>${escapeXml(feed.description)}</description>
    <language>en</language>
    <lastBuildDate>${last.toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(feed.link)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}
