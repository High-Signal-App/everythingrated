export const SITE_ORIGIN = 'https://ratings.highsignal.app';

export type PublicStaticSurface = {
  id: string;
  path: string;
  markdownPath: string;
  title: string;
  description: string;
  markdown: string;
  changeFrequency: 'daily' | 'weekly' | 'monthly';
  priority: number;
};

export const PUBLIC_STATIC_SURFACES: readonly PublicStaticSurface[] = [
  {
    id: 'home',
    path: '/',
    markdownPath: '/index.md',
    title: 'EverythingRated',
    description: 'Multi-axis adoption ratings for AI developer tools.',
    markdown:
      'Compare AI developer tools across maintenance, community, license, API stability, footprint, and AI portability. Ratings are anonymous and each axis remains visible.',
    changeFrequency: 'weekly',
    priority: 1,
  },
  {
    id: 'about',
    path: '/about',
    markdownPath: '/about.md',
    title: 'About EverythingRated',
    description: 'How multi-axis ratings preserve decision context.',
    markdown:
      'EverythingRated keeps category-specific trade-offs visible instead of collapsing every decision into one star average. Visitors can rate without an account.',
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  {
    id: 'trending',
    path: '/trending',
    markdownPath: '/trending.md',
    title: 'Trending',
    description: 'Current status of the cross-directory trending board.',
    markdown:
      'The cross-directory trending board is paused while EverythingRated focuses on AI developer-tool adoption decisions. The active tool board remains available from the homepage.',
    changeFrequency: 'monthly',
    priority: 0.4,
  },
  {
    id: 'stack',
    path: '/stack',
    markdownPath: '/stack.md',
    title: 'Stack builder',
    description: 'Current status of the cross-directory stack builder.',
    markdown:
      'The cross-directory stack builder is paused. Existing directory and item pages remain public, and the active product focuses on comparing AI developer tools.',
    changeFrequency: 'monthly',
    priority: 0.4,
  },
  {
    id: 'random',
    path: '/random',
    markdownPath: '/random.md',
    title: 'Random item',
    description: 'Open a randomly selected rated item.',
    markdown:
      'The HTML route selects a public directory and item using the published JSON inventories, then redirects the visitor to that item page.',
    changeFrequency: 'weekly',
    priority: 0.5,
  },
  {
    id: 'aspects',
    path: '/aspects',
    markdownPath: '/aspects.md',
    title: 'Aspects',
    description: 'Current status of the cross-directory aspect explorer.',
    markdown:
      'The cross-directory aspect explorer is paused. The active AI developer-tool board uses six adoption axes: maintenance, community, license, API stability, footprint, and AI portability.',
    changeFrequency: 'monthly',
    priority: 0.4,
  },
  {
    id: 'api-docs',
    path: '/api-docs',
    markdownPath: '/api-docs.md',
    title: 'API and feeds',
    description: 'Public machine-readable EverythingRated resources.',
    markdown:
      'Public data resources include the directory inventory, per-directory item JSON, per-directory RSS, item JSON, the XML sitemap, robots.txt, and the agent catalog.',
    changeFrequency: 'monthly',
    priority: 0.65,
  },
  {
    id: 'feeds',
    path: '/feeds',
    markdownPath: '/feeds.md',
    title: 'Feeds',
    description: 'Directory, item, RSS, sitemap, and crawler resources.',
    markdown:
      'EverythingRated publishes directory and item inventories as JSON, per-directory RSS feeds, and crawler discovery files. These resources are cataloged separately from HTML pages.',
    changeFrequency: 'weekly',
    priority: 0.6,
  },
  {
    id: 'privacy',
    path: '/privacy',
    markdownPath: '/privacy.md',
    title: 'Privacy',
    description: 'Anonymous ratings, visitor identifiers, and analytics.',
    markdown:
      'EverythingRated has no user accounts. A random httpOnly er_visitor cookie is created only after the first rating so later ratings can supersede earlier ones. Product analytics use a pseudonymous visitor identifier; the optional feedback widget is loaded only when configured.',
    changeFrequency: 'monthly',
    priority: 0.3,
  },
  {
    id: 'terms',
    path: '/terms',
    markdownPath: '/terms.md',
    title: 'Terms',
    description: 'Terms for anonymous use of EverythingRated.',
    markdown:
      'Ratings are pseudonymous opinions, not endorsements or warranties. Spam, vote stuffing, and coordinated manipulation may be removed.',
    changeFrequency: 'monthly',
    priority: 0.3,
  },
];

export const PUBLIC_COLLECTIONS = [
  {
    id: 'directories',
    kind: 'collection',
    urlTemplate: `${SITE_ORIGIN}/d/{directory}`,
    markdownTemplate: `${SITE_ORIGIN}/d/{directory}.md`,
    source: `${SITE_ORIGIN}/directories.json`,
  },
  {
    id: 'items',
    kind: 'collection',
    urlTemplate: `${SITE_ORIGIN}/d/{directory}/{item}`,
    markdownTemplate: `${SITE_ORIGIN}/d/{directory}/{item}.md`,
    sourceTemplate: `${SITE_ORIGIN}/d/{directory}/items.json`,
  },
] as const;

export const PUBLIC_DATA_RESOURCES = [
  {
    id: 'directories-json',
    kind: 'data',
    url: `${SITE_ORIGIN}/directories.json`,
  },
  {
    id: 'directory-items-json',
    kind: 'data-template',
    urlTemplate: `${SITE_ORIGIN}/d/{directory}/items.json`,
  },
  {
    id: 'directory-rss',
    kind: 'feed-template',
    urlTemplate: `${SITE_ORIGIN}/d/{directory}/rss`,
  },
  {
    id: 'item-json',
    kind: 'data-template',
    urlTemplate: `${SITE_ORIGIN}/d/{directory}/{item}/item.json`,
  },
] as const;

export const PRIVATE_OR_CONTEXTUAL_PATHS = [
  '/moderation',
  '/my',
  '/submit-directory',
  '/d/{directory}/submit',
] as const;

export function publicAgentCatalog(origin = SITE_ORIGIN) {
  return {
    name: 'EverythingRated',
    version: '2',
    url: origin,
    llms: `${origin}/llms.txt`,
    llmsFull: `${origin}/llms-full.txt`,
    sitemap: `${origin}/sitemap.xml`,
    robots: `${origin}/robots.txt`,
    openapi: `${origin}/openapi.json`,
    markdown: {
      suffix: '.md',
      negotiation: false,
    },
    surfaces: PUBLIC_STATIC_SURFACES.map((surface) => ({
      id: surface.id,
      url: `${origin}${surface.path}`,
      md: `${origin}${surface.markdownPath}`,
      kind: 'static',
      description: surface.description,
    })),
    collections: PUBLIC_COLLECTIONS.map((collection) =>
      Object.fromEntries(
        Object.entries(collection).map(([key, value]) => [
          key,
          typeof value === 'string' ? value.replace(SITE_ORIGIN, origin) : value,
        ])
      )
    ),
    dataResources: PUBLIC_DATA_RESOURCES.map((resource) =>
      Object.fromEntries(
        Object.entries(resource).map(([key, value]) => [
          key,
          typeof value === 'string' ? value.replace(SITE_ORIGIN, origin) : value,
        ])
      )
    ),
    auth: {
      public: true,
      notes:
        'Public catalog pages are readable without an account. /my is visitor-specific, /moderation is token-gated, and submission routes are intentionally excluded.',
    },
  };
}
