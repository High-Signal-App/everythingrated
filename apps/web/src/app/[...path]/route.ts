import { PUBLIC_STATIC_SURFACES, SITE_ORIGIN } from '@/lib/public-surfaces';
import { getDirectoryBySlug, getItemAggregate, listItemsWithAggregates } from '@/lib/ratings';

export const dynamic = 'force-dynamic';

function markdownResponse(body: string, status = 200) {
  return new Response(`${body.trim()}\n`, {
    status,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

function stripMarkdownSuffix(segment: string) {
  return segment.endsWith('.md') ? segment.slice(0, -3) : null;
}

function score(value: number) {
  return value > 0 ? value.toFixed(1) : 'Not yet rated';
}

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const routePath = `/${path.join('/')}`;
  const staticSurface = PUBLIC_STATIC_SURFACES.find(
    (surface) => surface.markdownPath === routePath
  );
  if (staticSurface) {
    return markdownResponse(`# ${staticSurface.title}

${staticSurface.markdown}

## Links

- [HTML page](${SITE_ORIGIN}${staticSurface.path})
- [EverythingRated home](${SITE_ORIGIN}/)
- [Agent catalog](${SITE_ORIGIN}/api/ai)`);
  }

  if (path.length === 2 && path[0] === 'd') {
    const directorySlug = stripMarkdownSuffix(path[1]);
    if (!directorySlug) return markdownResponse('# Not found', 404);
    const directory = await getDirectoryBySlug(directorySlug);
    if (!directory) return markdownResponse('# Directory not found', 404);
    const items = await listItemsWithAggregates(directory.id, null);
    const itemRows = items.map(
      ({ item, overall, totalRaters }) =>
        `- [${item.name}](${SITE_ORIGIN}/d/${directory.slug}/${item.slug}.md) — ${score(overall)} overall; ${totalRaters} rater${totalRaters === 1 ? '' : 's'}. ${item.description}`
    );
    return markdownResponse(`# ${directory.name}

${directory.heroCopy}

## Items

${itemRows.length ? itemRows.join('\n') : 'No items are currently published in this directory.'}

## Resources

- [HTML directory](${SITE_ORIGIN}/d/${directory.slug})
- [Items JSON](${SITE_ORIGIN}/d/${directory.slug}/items.json)
- [RSS feed](${SITE_ORIGIN}/d/${directory.slug}/rss)`);
  }

  if (path.length === 3 && path[0] === 'd') {
    const itemSlug = stripMarkdownSuffix(path[2]);
    if (!itemSlug) return markdownResponse('# Not found', 404);
    const result = await getItemAggregate(path[1], itemSlug, null);
    if (!result) return markdownResponse('# Item not found', 404);
    const { directory, data } = result;
    const aspectRows = data.aspects.map(
      ({ aspect, avg, count }) =>
        `- **${aspect.label}:** ${score(avg)} from ${count} rating${count === 1 ? '' : 's'} — ${aspect.description}`
    );
    return markdownResponse(`# ${data.item.name}

${data.item.description}

- **Directory:** [${directory.name}](${SITE_ORIGIN}/d/${directory.slug}.md)
- **Website:** ${data.item.websiteUrl}
- **Overall:** ${score(data.overall)}
- **Raters:** ${data.totalRaters}

## Adoption axes

${aspectRows.join('\n')}

## Resources

- [HTML rating page](${SITE_ORIGIN}/d/${directory.slug}/${data.item.slug})
- [Item JSON](${SITE_ORIGIN}/d/${directory.slug}/${data.item.slug}/item.json)`);
  }

  return markdownResponse('# Not found', 404);
}
