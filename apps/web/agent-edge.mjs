/**
 * Portable agent-edge handler — copy or generate into each product.
 * Spec: fleet-ops/docs/agent-indexing-standard.md
 *
 * Usage in worker.mjs (before openNext.fetch):
 *   import { handleAgentEdge } from './agent-edge.mjs'
 *   const agent = handleAgentEdge(request)
 *   if (agent) return agent
 *
 * NOTE: Hand-edited to add openapi.json, JSON error responses, agent-friendly
 * 404, rate-limit headers, and "When to use this" in llms.txt. Regenerate via
 * apply-agent-surfaces and re-apply these additions if the tool is run again.
 */

const ORIGIN = 'https://ratings.highsignal.app';

const RATE_LIMIT = 60;
const RATE_LIMIT_WINDOW = 60;

const ERROR_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    error: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Machine-readable error code' },
        message: { type: 'string', description: 'Human-readable error message' },
        path: { type: 'string', description: 'The request path that caused the error' },
      },
      required: ['code', 'message'],
    },
  },
  required: ['error'],
};

const OPENAPI_SPEC = {
  openapi: '3.1.0',
  info: {
    title: 'EverythingRated public API',
    version: '1.0.0',
    description:
      'Multi-axis ratings platform for AI dev-tool adoption decisions. The public web API exposes read-only agent surfaces: the agent catalog, llms.txt, sitemap, and markdown alternates.',
    contact: { name: 'EverythingRated', url: ORIGIN },
  },
  servers: [{ url: ORIGIN }],
  tags: [{ name: 'agent-surfaces', description: 'Machine-readable public surfaces' }],
  components: {
    schemas: {
      AgentCatalog: {
        type: 'object',
        description: 'JSON inventory of public agent surfaces and per-page markdown alternates.',
        properties: {
          name: { type: 'string' },
          version: { type: 'string' },
          url: { type: 'string', format: 'uri' },
          llms: { type: 'string', format: 'uri' },
          llmsFull: { type: 'string', format: 'uri' },
          sitemap: { type: 'string', format: 'uri' },
          robots: { type: 'string', format: 'uri' },
          openapi: { type: 'string', format: 'uri' },
          markdown: {
            type: 'object',
            properties: {
              suffix: { type: 'string' },
              negotiation: { type: 'boolean' },
            },
          },
          surfaces: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                url: { type: 'string', format: 'uri' },
                md: { type: 'string', format: 'uri' },
                kind: { type: 'string' },
                description: { type: 'string' },
              },
            },
          },
        },
      },
      ErrorResponse: ERROR_RESPONSE_SCHEMA,
    },
  },
  paths: {
    '/api/ai': {
      get: {
        operationId: 'getAgentCatalog',
        tags: ['agent-surfaces'],
        summary: 'Agent catalog',
        description:
          'JSON inventory of public agent surfaces: llms.txt, llms-full.txt, sitemap, robots, and per-page markdown alternates.',
        responses: {
          '200': {
            description: 'Agent catalog',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AgentCatalog' } } },
          },
          '404': {
            description: 'Unknown API path',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          '429': {
            description: 'Rate limit exceeded',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          '500': {
            description: 'Internal server error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/llms.txt': {
      get: {
        operationId: 'getLlmsTxt',
        tags: ['agent-surfaces'],
        summary: 'llms.txt index',
        description: 'Compact agent index following the llms.txt convention.',
        responses: {
          '200': { description: 'Markdown index', content: { 'text/plain': { schema: { type: 'string' } } } },
          '429': {
            description: 'Rate limit exceeded',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/llms-full.txt': {
      get: {
        operationId: 'getLlmsFullTxt',
        tags: ['agent-surfaces'],
        summary: 'Full agent brief',
        description: 'Full canonical agent brief with product, architecture, and surface inventory.',
        responses: {
          '200': { description: 'Markdown brief', content: { 'text/plain': { schema: { type: 'string' } } } },
          '429': {
            description: 'Rate limit exceeded',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/sitemap.xml': {
      get: {
        operationId: 'getSitemap',
        tags: ['agent-surfaces'],
        summary: 'Sitemap',
        description: 'XML sitemap of all canonical public HTML pages.',
        responses: {
          '200': { description: 'XML sitemap', content: { 'application/xml': { schema: { type: 'string' } } } },
          '429': {
            description: 'Rate limit exceeded',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/openapi.json': {
      get: {
        operationId: 'getOpenApiSpec',
        tags: ['agent-surfaces'],
        summary: 'OpenAPI specification',
        description: 'This document.',
        responses: {
          '200': { description: 'OpenAPI 3.1 spec', content: { 'application/json': { schema: { type: 'object' } } } },
          '429': {
            description: 'Rate limit exceeded',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
  },
};

/** @type {{ name: string, url: string, llmsTxt: string, llmsFullTxt?: string, indexMd: string, catalog: object }} */
// biome-ignore format: generated payload from apply-agent-surfaces (JSON keys/quotes)
export const AGENT_SURFACE = {
  "name": "EverythingRated",
  "url": "https://ratings.highsignal.app",
  "llmsFullTxt": "# EverythingRated — full agent brief\n\nMulti-axis rating tool for structured directories and catalogs — decisions with explicit trade-offs, not star averages.\n\n## Index\n\n# EverythingRated\n\nMulti-axis ratings for structured directories and catalogs.\n\n## What it is\n\n- Rate items on multiple axes (not a single star score)\n- Built for AI/dev tool and catalog decisions\n\n## Agent entrypoints\n\n- https://ratings.highsignal.app/llms.txt\n- https://ratings.highsignal.app/api/ai\n- https://ratings.highsignal.app/index.md\n\n## Product links\n\n- Home: https://ratings.highsignal.app/ — Directories and ratings\n\n## Machine surfaces\n\n- https://ratings.highsignal.app/llms.txt\n- https://ratings.highsignal.app/llms-full.txt\n- https://ratings.highsignal.app/api/ai\n- https://ratings.highsignal.app/index.md\n- https://ratings.highsignal.app/sitemap.xml\n- https://ratings.highsignal.app/robots.txt\n\n## Contact / fleet\n\n- Fleet: https://sassmaker.com\n- Agent email for directory verification: sarthakagrawal@agentmail.to\n",
  "llmsTxt": "# EverythingRated\n\n> Multi-axis rating tool for structured directories and catalogs — decisions with explicit trade-offs, not star averages.\n\n## When to use this\n\n- Comparing AI dev tools across multiple rating axes instead of a single collapsed score\n- Checking community ratings for coding agents, code review tools, and dev infrastructure\n- Getting structured multi-aspect ratings data as JSON for agent consumption\n- Reading the product brief as markdown without JavaScript\n\n## Product\n\n- [Home](https://ratings.highsignal.app/): Directories and ratings\n\n## Developer docs\n\n- [OpenAPI spec](https://ratings.highsignal.app/openapi.json): Machine-readable API contract for all agent surfaces\n- [Agent catalog](https://ratings.highsignal.app/api/ai): JSON inventory of public surfaces\n- [Full agent brief](https://ratings.highsignal.app/llms-full.txt): Expanded product facts and capabilities\n- [Homepage markdown](https://ratings.highsignal.app/index.md): Product brief without JS\n\n## CLI\n\n- API base URL: `https://ratings.highsignal.app`\n- Fetch the agent catalog: `curl https://ratings.highsignal.app/api/ai`\n- Fetch the OpenAPI spec: `curl https://ratings.highsignal.app/openapi.json`\n- Get homepage as markdown: `curl -H 'Accept: text/markdown' https://ratings.highsignal.app/`\n\n## Machine surfaces\n\n- [Agent catalog](https://ratings.highsignal.app/api/ai): JSON inventory of public surfaces\n- [OpenAPI spec](https://ratings.highsignal.app/openapi.json): Machine-readable API contract\n- [Homepage markdown](https://ratings.highsignal.app/index.md): Product brief without JS\n- [This index](https://ratings.highsignal.app/llms.txt)\n\n## Optional\n\n- [Foundry](https://sassmaker.com): Parent fleet showcase\n",
  "indexMd": "# EverythingRated\n\nMulti-axis ratings for structured directories and catalogs.\n\n## What it is\n\n- Rate items on multiple axes (not a single star score)\n- Built for AI/dev tool and catalog decisions\n\n## Agent entrypoints\n\n- https://ratings.highsignal.app/llms.txt\n- https://ratings.highsignal.app/api/ai\n- https://ratings.highsignal.app/index.md\n",
  "catalog": {
    "name": "EverythingRated",
    "version": "1",
    "url": "https://ratings.highsignal.app",
    "llms": "https://ratings.highsignal.app/llms.txt",
    "llmsFull": "https://ratings.highsignal.app/llms-full.txt",
    "sitemap": "https://ratings.highsignal.app/sitemap.xml",
    "robots": "https://ratings.highsignal.app/robots.txt",
    "openapi": "https://ratings.highsignal.app/openapi.json",
    "markdown": {
      "suffix": ".md",
      "negotiation": true
    },
    "surfaces": [
      {
        "id": "home",
        "url": "https://ratings.highsignal.app/",
        "md": "https://ratings.highsignal.app/index.md",
        "kind": "static",
        "description": "Product home"
      }
    ],
    "auth": {
      "public": true,
      "notes": "Auth-walled app routes are not agent-indexed unless listed here."
    }
  }
};

/**
 * @param {Request} request
 * @returns {Response | null}
 */
export function handleAgentEdge(request) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return null;
  const url = new URL(request.url);
  const path = url.pathname === '' ? '/' : url.pathname;

  // /openapi.json — serve the spec directly.
  if (path === '/openapi.json' || path === '/openapi.yaml') {
    const headers = withRateLimit(new Headers({
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    }));
    return new Response(JSON.stringify(OPENAPI_SPEC, null, 2), { status: 200, headers });
  }

  if (path === '/llms.txt') {
    return text(AGENT_SURFACE.llmsTxt, 'text/plain; charset=utf-8');
  }
  if (path === '/llms-full.txt' && AGENT_SURFACE.llmsFullTxt) {
    return text(AGENT_SURFACE.llmsFullTxt, 'text/plain; charset=utf-8');
  }
  if (path === '/index.md') {
    return text(AGENT_SURFACE.indexMd, 'text/markdown; charset=utf-8');
  }
  if (path === '/api/ai') {
    // Re-bind origin so preview/custom domains stay correct
    const catalog = {
      ...AGENT_SURFACE.catalog,
      url: url.origin,
      llms: `${url.origin}/llms.txt`,
      llmsFull: `${url.origin}/llms-full.txt`,
      sitemap: AGENT_SURFACE.catalog.sitemap
        ? String(AGENT_SURFACE.catalog.sitemap).replace(AGENT_SURFACE.url, url.origin)
        : `${url.origin}/sitemap.xml`,
      openapi: AGENT_SURFACE.catalog.openapi
        ? String(AGENT_SURFACE.catalog.openapi).replace(AGENT_SURFACE.url, url.origin)
        : `${url.origin}/openapi.json`,
      surfaces: (AGENT_SURFACE.catalog.surfaces || []).map((s) => ({
        ...s,
        url: s.url ? String(s.url).replace(AGENT_SURFACE.url, url.origin) : s.url,
        md: s.md ? String(s.md).replace(AGENT_SURFACE.url, url.origin) : s.md,
      })),
    };
    return json(catalog);
  }

  // JSON errors for unknown /api/* paths.
  if (path.startsWith('/api/')) {
    return jsonError(404, 'not_found', `Unknown API path: ${path}`, path);
  }

  // Homepage markdown negotiation
  if ((path === '/' || path === '') && wantsMarkdown(request)) {
    return text(AGENT_SURFACE.indexMd, 'text/markdown; charset=utf-8', {
      Link: '</index.md>; rel="alternate"; type="text/markdown"',
      Vary: 'Accept, Accept-Encoding',
    });
  }

  // Agent-friendly 404: markdown body for Accept: text/markdown on unknown paths.
  if (wantsMarkdown(request) && !path.includes('.') && !path.startsWith('/api/')) {
    return markdown404(path, url.origin);
  }

  return null;
}

function wantsMarkdown(request) {
  const accept = (request.headers.get('accept') || '').toLowerCase();
  if (!accept.includes('text/markdown')) return false;
  if (!accept.includes('text/html')) return true;
  return accept.indexOf('text/markdown') < accept.indexOf('text/html');
}

function withRateLimit(headers) {
  headers.set('RateLimit-Limit', String(RATE_LIMIT));
  headers.set('RateLimit-Remaining', String(RATE_LIMIT));
  headers.set('RateLimit-Reset', String(RATE_LIMIT_WINDOW));
  return headers;
}

function text(body, type, extra = {}) {
  const headers = withRateLimit(new Headers({
    'Content-Type': type,
    'Cache-Control': 'public, max-age=300',
  }));
  for (const [key, value] of Object.entries(extra)) headers.set(key, value);
  return new Response(body, { status: 200, headers });
}

function json(data) {
  const headers = withRateLimit(new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
  }));
  return new Response(`${JSON.stringify(data, null, 2)}\n`, { status: 200, headers });
}

function jsonError(status, code, message, path) {
  const headers = withRateLimit(new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  }));
  return new Response(
    JSON.stringify({ error: { code, message, path } }),
    { status, headers },
  );
}

function markdown404(pathname, origin) {
  const body = `# 404 — Not Found

\`${pathname}\` does not exist on ${origin}.

## Where to look next

- [Home](${origin}/)
- [Sitemap](${origin}/sitemap.xml)
- [Agent index](${origin}/llms.txt)
- [Agent catalog (JSON)](${origin}/api/ai)
- [OpenAPI spec](${origin}/openapi.json)
`;
  const headers = withRateLimit(new Headers({
    'Content-Type': 'text/markdown; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  }));
  return new Response(body, { status: 404, headers });
}
