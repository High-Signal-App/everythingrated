import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __libsql__: Client | undefined;
}

// Repo-root-relative local.db so every workspace package + the Next.js app
// hit the same file regardless of cwd. Override via TURSO_CONNECTION_URL.
const REPO_ROOT_DB = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../local.db",
);

function makeClient(): Client {
  const url = process.env.TURSO_CONNECTION_URL ?? `file:${REPO_ROOT_DB}`;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  return createClient({ url, authToken });
}

const client = globalThis.__libsql__ ?? makeClient();
if (process.env.NODE_ENV !== "production") globalThis.__libsql__ = client;

export const db = drizzle(client, { schema });
export { schema };
export type DB = typeof db;
