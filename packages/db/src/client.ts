import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type DB = ReturnType<typeof drizzle<typeof schema>>;

/** Wrap a D1 binding with the Drizzle schema. */
export function createDb(d1: D1Database): DB {
  return drizzle(d1, { schema });
}

export { schema };
