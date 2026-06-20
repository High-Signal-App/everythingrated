import { createDb, type DB } from "@everythingrated/db";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Returns a Drizzle client bound to the request's D1 binding.
 * Production: bound by wrangler.toml. Local dev: bound by
 * `initOpenNextCloudflareForDev()` in next.config.ts (reads the same wrangler.toml).
 */
export async function getDb(): Promise<DB> {
  const { env } = await getCloudflareContext({ async: true });
  return createDb(env.DB);
}
