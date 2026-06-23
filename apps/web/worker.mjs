// worker.mjs — custom Worker entry that wraps OpenNext with timing middleware.
//
// Measures API response times with performance.now(), reports via the
// Server-Timing response header, and logs slow requests (>200ms) via
// console.warn.

import openNext from "./.open-next/worker.js";
import { withTiming } from "./timing.mjs";

// Durable Objects must be re-exported from the entry that wrangler.toml
// points at, otherwise the bindings can't resolve them at deploy time.
export {
  DOQueueHandler,
  DOShardedTagCache,
  BucketCachePurge,
} from "./.open-next/worker.js";

export default {
  fetch: withTiming((request, env, ctx) => openNext.fetch(request, env, ctx)),
};
