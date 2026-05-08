import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getModerationToken(): Promise<string | undefined> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env.MODERATION_TOKEN || process.env.MODERATION_TOKEN;
  } catch {
    return process.env.MODERATION_TOKEN;
  }
}
