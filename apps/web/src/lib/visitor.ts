import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

export const VISITOR_COOKIE = "er_visitor";
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Returns the visitor's existing cookie id, or null if absent.
 * Reading-only — safe in pages and Server Components.
 */
export async function readVisitorId(): Promise<string | null> {
  const c = await cookies();
  return c.get(VISITOR_COOKIE)?.value ?? null;
}

/**
 * Returns the visitor's id, minting + writing a new cookie if needed.
 * Only callable in Server Actions / Route Handlers (where cookies are
 * mutable). For read-only contexts, prefer `readVisitorId`.
 */
export async function ensureVisitorId(): Promise<string> {
  const c = await cookies();
  const existing = c.get(VISITOR_COOKIE)?.value;
  if (existing) return existing;
  const id = randomUUID();
  c.set(VISITOR_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
  });
  return id;
}
