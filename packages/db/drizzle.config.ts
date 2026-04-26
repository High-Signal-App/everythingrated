import type { Config } from "drizzle-kit";
import { resolve } from "node:path";
import "dotenv/config";

// Repo-root local.db so `pnpm db:push` and `pnpm dev` share state.
const REPO_ROOT_DB = resolve(__dirname, "../../local.db");

export default {
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_CONNECTION_URL ?? `file:${REPO_ROOT_DB}`,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
} satisfies Config;
