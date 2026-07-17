// worker.mjs — custom Worker entry that wraps OpenNext with timing middleware.
//
// Measures API response times with performance.now(), reports via the
// Server-Timing response header, and logs slow requests (>200ms) via
// console.warn.

import openNext from "./.open-next/worker.js";
import { withTiming } from "./timing.mjs";
import { handleAgentEdge } from './agent-edge.mjs';


// Durable Objects must be re-exported from the entry that wrangler.toml
// points at, otherwise the bindings can't resolve them at deploy time.
export {
  DOQueueHandler,
  DOShardedTagCache,
  BucketCachePurge,
} from "./.open-next/worker.js";


const CACHE_CONTROL = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800';
const CACHEABLE_EXACT = new Set([
  '/',
  '/about',
  '/trending',
  '/list',
  '/stack',
  '/random',
  '/aspects',
  '/api-docs',
  '/submit-directory',
  '/privacy',
  '/terms',
]);
const CACHEABLE_PREFIXES = ['/d', '/aspects'];
function isCacheableDocumentPath(pathname) {
  if (CACHEABLE_EXACT.has(pathname)) return true;
  for (const prefix of CACHEABLE_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return true;
  }
  return false;
}

export default {
  fetch: withTiming(async function fetch(request, env, ctx) {

    // Agent / LLM indexing surfaces (fleet GEO standard)
    {
      const agent = handleAgentEdge(request);
      if (agent) return agent;
    }
    try {
      if (request.method === 'GET') {
        const url = new URL(request.url);
        if (isCacheableDocumentPath(url.pathname)) {
          const cache = caches.default;
          const cached = await cache.match(request);
          if (cached) {
            const hit = new Response(cached.body, cached);
            hit.headers.set('x-edge-cache', 'HIT');
            return hit;
          }
          const response = await openNext.fetch(request, env, ctx);
          const contentType = response.headers.get('content-type') ?? '';
          if (response.status === 200 && contentType.includes('text/html')) {
            const body = await response.arrayBuffer();
            const headers = new Headers(response.headers);
            headers.set('Cache-Control', CACHE_CONTROL);
            const cacheable = new Response(body, {
              status: response.status,
              statusText: response.statusText,
              headers,
            });
            ctx.waitUntil(cache.put(request, cacheable.clone()));
            const client = new Response(body, {
              status: response.status,
              statusText: response.statusText,
              headers,
            });
            client.headers.set('x-edge-cache', 'MISS');
            return client;
          }
          return response;
        }
      }
      return await openNext.fetch(request, env, ctx);
    } catch (err) {
      console.error(`[error] ${request.method} ${new URL(request.url).pathname}:`, err.message, err.stack);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }),
};
