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

export default {
  fetch: withTiming(async function fetch(request, env, ctx) {

    // Agent / LLM indexing surfaces (fleet GEO standard)
    {
      const agent = handleAgentEdge(request);
      if (agent) return agent;
    }
    try {
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
