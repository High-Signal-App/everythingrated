/**
 * Portable agent-edge handler — copy or generate into each product.
 * Spec: fleet-ops/docs/agent-indexing-standard.md
 *
 * Usage in worker.mjs (before openNext.fetch):
 *   import { handleAgentEdge } from './agent-edge.mjs'
 *   const agent = handleAgentEdge(request)
 *   if (agent) return agent
 */

/** @type {{ name: string, url: string, llmsTxt: string, llmsFullTxt?: string, indexMd: string, catalog: object }} */
// biome-ignore format: generated payload from apply-agent-surfaces (JSON keys/quotes)
export const AGENT_SURFACE = {
  "name": "EverythingRated",
  "url": "https://ratings.highsignal.app",
  "llmsFullTxt": "# EverythingRated — full agent brief\n\nMulti-axis rating tool for structured directories and catalogs — decisions with explicit trade-offs, not star averages.\n\n## Index\n\n# EverythingRated\n\nMulti-axis ratings for structured directories and catalogs.\n\n## What it is\n\n- Rate items on multiple axes (not a single star score)\n- Built for AI/dev tool and catalog decisions\n\n## Agent entrypoints\n\n- https://ratings.highsignal.app/llms.txt\n- https://ratings.highsignal.app/api/ai\n- https://ratings.highsignal.app/index.md\n\n## Product links\n\n- Home: https://ratings.highsignal.app/ — Directories and ratings\n\n## Machine surfaces\n\n- https://ratings.highsignal.app/llms.txt\n- https://ratings.highsignal.app/llms-full.txt\n- https://ratings.highsignal.app/api/ai\n- https://ratings.highsignal.app/index.md\n- https://ratings.highsignal.app/sitemap.xml\n- https://ratings.highsignal.app/robots.txt\n\n## Contact / fleet\n\n- Fleet: https://sassmaker.com\n- Agent email for directory verification: sarthakagrawal@agentmail.to\n",
  "llmsTxt": "# EverythingRated\n\n> Multi-axis rating tool for structured directories and catalogs — decisions with explicit trade-offs, not star averages.\n\n## Product\n\n- [Home](https://ratings.highsignal.app/): Directories and ratings\n\n## Machine surfaces\n\n- [Agent catalog](https://ratings.highsignal.app/api/ai): JSON inventory of public surfaces\n- [Homepage markdown](https://ratings.highsignal.app/index.md): Product brief without JS\n- [This index](https://ratings.highsignal.app/llms.txt)\n\n## Optional\n\n- [Foundry](https://sassmaker.com): Parent fleet showcase\n",
  "indexMd": "# EverythingRated\n\nMulti-axis ratings for structured directories and catalogs.\n\n## What it is\n\n- Rate items on multiple axes (not a single star score)\n- Built for AI/dev tool and catalog decisions\n\n## Agent entrypoints\n\n- https://ratings.highsignal.app/llms.txt\n- https://ratings.highsignal.app/api/ai\n- https://ratings.highsignal.app/index.md\n",
  "catalog": {
    "name": "EverythingRated",
    "version": "1",
    "url": "https://ratings.highsignal.app",
    "llms": "https://ratings.highsignal.app/llms.txt",
    "llmsFull": "https://ratings.highsignal.app/llms-full.txt",
    "sitemap": "https://ratings.highsignal.app/sitemap.xml",
    "robots": "https://ratings.highsignal.app/robots.txt",
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
      surfaces: (AGENT_SURFACE.catalog.surfaces || []).map((s) => ({
        ...s,
        url: s.url ? String(s.url).replace(AGENT_SURFACE.url, url.origin) : s.url,
        md: s.md ? String(s.md).replace(AGENT_SURFACE.url, url.origin) : s.md,
      })),
    };
    return json(catalog);
  }

  // Homepage markdown negotiation
  if ((path === '/' || path === '') && wantsMarkdown(request)) {
    return text(AGENT_SURFACE.indexMd, 'text/markdown; charset=utf-8', {
      Link: '</index.md>; rel="alternate"; type="text/markdown"',
      Vary: 'Accept',
    });
  }

  return null;
}

function wantsMarkdown(request) {
  const accept = (request.headers.get('accept') || '').toLowerCase();
  if (!accept.includes('text/markdown')) return false;
  if (!accept.includes('text/html')) return true;
  return accept.indexOf('text/markdown') < accept.indexOf('text/html');
}

function text(body, type, extra = {}) {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': type,
      'Cache-Control': 'public, max-age=300',
      ...extra,
    },
  });
}

function json(data) {
  return new Response(`${JSON.stringify(data, null, 2)}\n`, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
