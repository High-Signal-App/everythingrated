import { directories, items, itemSubmissions,ratings } from "@everythingrated/db";
import { and, desc, eq, inArray, ne, or } from "drizzle-orm";

import { getDb } from "./db";
import { readVisitorId } from "./visitor";

export const PILOT_DIRECTORY_SLUG = "ai-dev-tools";
const MAX_TEXT_LENGTH = 500;
const MIN_DESCRIPTION_LENGTH = 20;
const MAX_PENDING_PER_VISITOR_PER_DAY = 3;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ItemSubmissionStatus = "pending" | "approved" | "rejected" | "merged";

export type ItemSubmission = {
  id: string;
  directorySlug: string;
  directoryId: string;
  slug: string;
  name: string;
  description: string;
  websiteUrl: string;
  submitterVisitorId: string | null;
  submitterName: string | null;
  submitterEmail: string | null;
  status: ItemSubmissionStatus;
  mergedIntoItemId: string | null;
  mergedIntoItemSlug: string | null;
  moderatorNote: string | null;
  createdAt: Date;
  moderatedAt: Date | null;
  source: "visitor" | "fixture";
};

export type ItemSubmissionInput = {
  directorySlug: string;
  name: string;
  description: string;
  websiteUrl: string;
  submitterName?: string;
  submitterEmail?: string;
};

export type ItemSubmissionResult =
  | { ok: true; id: string }
  | { ok: false; error: string; existingItemSlug?: string };

type ItemSubmissionValidation = { ok: true } | { ok: false; error: string };

export type ItemSubmissionTrustSignals = {
  trustedSubmitter: boolean;
  priorApprovals: number;
  urlPlausible: boolean;
  domainAligned: boolean;
  duplicateConfidence: "none" | "low" | "high";
  duplicateHint: string | null;
};

export function slugifyItemName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function normalizeItemName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeWebsiteUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const withScheme = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    const url = new URL(withScheme);
    if (url.protocol !== "https:") return null;
    url.hash = "";
    let pathname = url.pathname.replace(/\/+$/, "");
    if (pathname === "") pathname = "";
    return `${url.protocol}//${url.hostname.toLowerCase()}${pathname}${url.search}`;
  } catch {
    return null;
  }
}

export function parseWebsiteHost(websiteUrl: string): string | null {
  const normalized = normalizeWebsiteUrl(websiteUrl);
  if (!normalized) return null;
  try {
    const host = new URL(normalized).hostname.toLowerCase();
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return null;
  }
}

export function validateItemSubmission(
  input: ItemSubmissionInput,
): ItemSubmissionValidation {
  const name = input.name.trim();
  const description = input.description.trim();
  const websiteUrl = input.websiteUrl.trim();

  if (name.length < 2) {
    return { ok: false, error: "Tool name must be at least 2 characters." };
  }
  if (description.length < MIN_DESCRIPTION_LENGTH) {
    return {
      ok: false,
      error: `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters.`,
    };
  }
  if ([name, description].some((value) => value.length > MAX_TEXT_LENGTH)) {
    return { ok: false, error: "Keep each field under 500 characters." };
  }
  if (!normalizeWebsiteUrl(websiteUrl)) {
    return { ok: false, error: "Website must be a valid https:// URL." };
  }

  const submitterEmail = input.submitterEmail?.trim();
  if (submitterEmail && !EMAIL_PATTERN.test(submitterEmail)) {
    return { ok: false, error: "Submitter email looks malformed." };
  }

  if (input.directorySlug !== PILOT_DIRECTORY_SLUG) {
    return {
      ok: false,
      error: "Item suggestions are only open for the AI dev tools directory during the pilot.",
    };
  }

  return { ok: true };
}

export function isUrlPlausible(websiteUrl: string): boolean {
  const host = parseWebsiteHost(websiteUrl);
  if (!host) return false;
  if (host === "example.invalid" || host.endsWith(".invalid")) return false;
  if (!host.includes(".")) return false;
  return true;
}

export function isDomainAligned(name: string, websiteUrl: string): boolean {
  const host = parseWebsiteHost(websiteUrl);
  if (!host) return false;
  const tokens = normalizeItemName(name).split(" ").filter(Boolean);
  if (tokens.length === 0) return false;
  const stem = host.split(".")[0] ?? "";
  return tokens.some(
    (token) => stem.includes(token) || token.includes(stem) || host.includes(token),
  );
}

export async function detectDuplicateSlug(
  directoryId: string,
  slug: string,
  excludeSubmissionId?: string,
): Promise<{ duplicate: boolean; existingItemSlug?: string }> {
  const db = await getDb();
  const [liveItem] = await db
    .select({ slug: items.slug })
    .from(items)
    .where(and(eq(items.directoryId, directoryId), eq(items.slug, slug)));
  if (liveItem) {
    return { duplicate: true, existingItemSlug: liveItem.slug };
  }

  const conditions = [
    eq(itemSubmissions.directoryId, directoryId),
    eq(itemSubmissions.slug, slug),
    or(
      eq(itemSubmissions.status, "pending"),
      eq(itemSubmissions.status, "approved"),
    ),
  ];
  if (excludeSubmissionId) {
    conditions.push(ne(itemSubmissions.id, excludeSubmissionId));
  }

  const activeSubs = await db
    .select({ slug: itemSubmissions.slug })
    .from(itemSubmissions)
    .where(and(...conditions));
  if (activeSubs.length > 0) {
    return { duplicate: true, existingItemSlug: activeSubs[0].slug };
  }

  return { duplicate: false };
}

export async function detectDuplicateName(
  directoryId: string,
  name: string,
): Promise<{ duplicate: boolean; existingItemSlug?: string }> {
  const normalized = normalizeItemName(name);
  if (!normalized) return { duplicate: false };

  const db = await getDb();
  const liveItems = await db
    .select({ slug: items.slug, name: items.name })
    .from(items)
    .where(eq(items.directoryId, directoryId));

  for (const item of liveItems) {
    if (normalizeItemName(item.name) === normalized) {
      return { duplicate: true, existingItemSlug: item.slug };
    }
  }

  const activeSubs = await db
    .select({ slug: itemSubmissions.slug, name: itemSubmissions.name })
    .from(itemSubmissions)
    .where(
      and(
        eq(itemSubmissions.directoryId, directoryId),
        or(
          eq(itemSubmissions.status, "pending"),
          eq(itemSubmissions.status, "approved"),
        ),
      ),
    );
  for (const sub of activeSubs) {
    if (normalizeItemName(sub.name) === normalized) {
      return { duplicate: true, existingItemSlug: sub.slug };
    }
  }

  return { duplicate: false };
}

export async function detectDuplicateHost(
  directoryId: string,
  websiteUrl: string,
): Promise<{ duplicate: boolean; existingItemSlug?: string; host: string | null }> {
  const host = parseWebsiteHost(websiteUrl);
  if (!host) return { duplicate: false, host: null };

  const db = await getDb();
  const liveItems = await db
    .select({ slug: items.slug, websiteUrl: items.websiteUrl })
    .from(items)
    .where(eq(items.directoryId, directoryId));

  for (const item of liveItems) {
    if (parseWebsiteHost(item.websiteUrl) === host) {
      return { duplicate: true, existingItemSlug: item.slug, host };
    }
  }

  const activeSubs = await db
    .select({ slug: itemSubmissions.slug, websiteUrl: itemSubmissions.websiteUrl })
    .from(itemSubmissions)
    .where(
      and(
        eq(itemSubmissions.directoryId, directoryId),
        or(
          eq(itemSubmissions.status, "pending"),
          eq(itemSubmissions.status, "approved"),
        ),
      ),
    );
  for (const sub of activeSubs) {
    if (parseWebsiteHost(sub.websiteUrl) === host) {
      return { duplicate: true, existingItemSlug: sub.slug, host };
    }
  }

  return { duplicate: false, host };
}

export function computeTrustSignals(
  submission: ItemSubmission,
  allSubmissions: ItemSubmission[],
): ItemSubmissionTrustSignals {
  const priorApprovals = allSubmissions.filter(
    (row) =>
      row.status === "approved" &&
      ((submission.submitterVisitorId &&
        row.submitterVisitorId === submission.submitterVisitorId) ||
        (submission.submitterEmail &&
          row.submitterEmail &&
          row.submitterEmail === submission.submitterEmail)),
  ).length;

  const urlPlausible = isUrlPlausible(submission.websiteUrl);
  const domainAligned = isDomainAligned(submission.name, submission.websiteUrl);

  let duplicateConfidence: ItemSubmissionTrustSignals["duplicateConfidence"] = "none";
  let duplicateHint: string | null = null;
  if (submission.slug === "cursor" || normalizeItemName(submission.name).includes("cursor")) {
    duplicateConfidence = "high";
    duplicateHint = "Likely duplicate of seeded Cursor item.";
  } else if (
    normalizeItemName(submission.name).includes("continue") ||
    parseWebsiteHost(submission.websiteUrl) === "continue.dev"
  ) {
    duplicateConfidence = "high";
    duplicateHint = "Likely duplicate of seeded Continue item.";
  } else if (!domainAligned && !urlPlausible) {
    duplicateConfidence = "low";
    duplicateHint = "URL host does not align with tool name.";
  }

  return {
    trustedSubmitter: priorApprovals >= 2,
    priorApprovals,
    urlPlausible,
    domainAligned,
    duplicateConfidence,
    duplicateHint,
  };
}


export async function listItemSubmissions(
  directorySlug = PILOT_DIRECTORY_SLUG,
  status?: ItemSubmissionStatus,
): Promise<ItemSubmission[]> {
  const db = await getDb();
  const [directory] = await db
    .select({ id: directories.id, slug: directories.slug })
    .from(directories)
    .where(eq(directories.slug, directorySlug));
  if (!directory) return [];

  const baseWhere = eq(itemSubmissions.directoryId, directory.id);
  const rows = await (status
    ? db
        .select()
        .from(itemSubmissions)
        .where(and(baseWhere, eq(itemSubmissions.status, status)))
        .orderBy(desc(itemSubmissions.createdAt))
    : db
        .select()
        .from(itemSubmissions)
        .where(baseWhere)
        .orderBy(desc(itemSubmissions.createdAt)));


  // For merged rows, resolve the target slug for UI links
  const mergedIds = rows.filter((r) => r.mergedIntoItemId).map((r) => r.mergedIntoItemId!);
  let slugById = new Map<string, string>();
  if (mergedIds.length > 0) {
    const targets = await db
      .select({ id: items.id, slug: items.slug })
      .from(items)
      .where(inArray(items.id, mergedIds));
    slugById = new Map(targets.map((t) => [t.id, t.slug]));
  }

  // Enrich with directorySlug + convert dates + default source for UI compat.
  return rows.map((r) => ({
    id: r.id,
    directorySlug: directory.slug,
    directoryId: r.directoryId,
    slug: r.slug,
    name: r.name,
    description: r.description,
    websiteUrl: r.websiteUrl,
    submitterVisitorId: r.submitterVisitorId ?? null,
    submitterName: r.submitterName ?? null,
    submitterEmail: r.submitterEmail ?? null,
    status: r.status as ItemSubmissionStatus,
    mergedIntoItemId: r.mergedIntoItemId ?? null,
    mergedIntoItemSlug: r.mergedIntoItemId ? (slugById.get(r.mergedIntoItemId) ?? null) : null,
    moderatorNote: r.moderatorNote ?? null,
    createdAt: r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt),
    moderatedAt: r.moderatedAt ? (r.moderatedAt instanceof Date ? r.moderatedAt : new Date(r.moderatedAt)) : null,
    source: "visitor" as const,
  }));
}

async function countRecentPendingForVisitor(
  visitorId: string,
  directoryId: string,
): Promise<number> {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const rows = await (await getDb())
    .select({ id: itemSubmissions.id, createdAt: itemSubmissions.createdAt })
    .from(itemSubmissions)
    .where(
      and(
        eq(itemSubmissions.directoryId, directoryId),
        eq(itemSubmissions.submitterVisitorId, visitorId),
        eq(itemSubmissions.status, "pending"),
      ),
    );
  return rows.filter((r) => {
    const t = r.createdAt instanceof Date ? r.createdAt.getTime() : Number(r.createdAt);
    return t >= dayAgo;
  }).length;
}

export async function submitItemSuggestion(
  input: ItemSubmissionInput,
): Promise<ItemSubmissionResult> {
  const validation = validateItemSubmission(input);
  if (!validation.ok) return validation;

  const db = await getDb();
  const [directory] = await db
    .select()
    .from(directories)
    .where(eq(directories.slug, input.directorySlug));
  if (!directory) {
    return { ok: false, error: "Directory not found." };
  }

  const name = input.name.trim();
  const slug = slugifyItemName(name);
  if (!slug) {
    return { ok: false, error: "Tool name needs letters or numbers." };
  }

  const visitorId = await readVisitorId();
  const recent = visitorId ? await countRecentPendingForVisitor(visitorId, directory.id) : 0;
  if (visitorId && recent >= MAX_PENDING_PER_VISITOR_PER_DAY) {
    return {
      ok: false,
      error: "You already have several suggestions pending review. Try again tomorrow.",
    };
  }

  const slugDup = await detectDuplicateSlug(directory.id, slug);
  if (slugDup.duplicate && slugDup.existingItemSlug) {
    return {
      ok: false,
      error: `That tool already exists as /d/${directory.slug}/${slugDup.existingItemSlug}.`,
      existingItemSlug: slugDup.existingItemSlug,
    };
  }

  const nameDup = await detectDuplicateName(directory.id, name);
  if (nameDup.duplicate && nameDup.existingItemSlug) {
    return {
      ok: false,
      error: `A similar tool is already listed as /d/${directory.slug}/${nameDup.existingItemSlug}.`,
      existingItemSlug: nameDup.existingItemSlug,
    };
  }

  const hostDup = await detectDuplicateHost(directory.id, input.websiteUrl);
  if (hostDup.duplicate && hostDup.existingItemSlug) {
    return {
      ok: false,
      error: `That website is already associated with /d/${directory.slug}/${hostDup.existingItemSlug}.`,
      existingItemSlug: hostDup.existingItemSlug,
    };
  }

  const websiteUrl = normalizeWebsiteUrl(input.websiteUrl.trim())!;
  const id = crypto.randomUUID();
  const now = new Date();
  await db.insert(itemSubmissions).values({
    id,
    directoryId: directory.id,
    slug,
    name,
    description: input.description.trim(),
    websiteUrl,
    submitterVisitorId: visitorId ?? null,
    submitterName: input.submitterName?.trim() || null,
    submitterEmail: input.submitterEmail?.trim() || null,
    status: "pending",
    mergedIntoItemId: null,
    moderatorNote: null,
    createdAt: now,
    moderatedAt: null,
  });

  return { ok: true, id };
}

async function findMergeTarget(
  submission: ItemSubmission,
): Promise<{ itemId: string; slug: string } | null> {
  const db = await getDb();
  const slugMatch = await db
    .select({ id: items.id, slug: items.slug })
    .from(items)
    .where(and(eq(items.directoryId, submission.directoryId), eq(items.slug, submission.slug)));
  if (slugMatch[0]) return { itemId: slugMatch[0].id, slug: slugMatch[0].slug };

  const nameDup = await detectDuplicateName(submission.directoryId, submission.name);
  if (nameDup.existingItemSlug) {
    const [item] = await db
      .select({ id: items.id, slug: items.slug })
      .from(items)
      .where(
        and(
          eq(items.directoryId, submission.directoryId),
          eq(items.slug, nameDup.existingItemSlug),
        ),
      );
    if (item) return { itemId: item.id, slug: item.slug };
  }

  const hostDup = await detectDuplicateHost(submission.directoryId, submission.websiteUrl);
  if (hostDup.existingItemSlug) {
    const [item] = await db
      .select({ id: items.id, slug: items.slug })
      .from(items)
      .where(
        and(
          eq(items.directoryId, submission.directoryId),
          eq(items.slug, hostDup.existingItemSlug),
        ),
      );
    if (item) return { itemId: item.id, slug: item.slug };
  }

  return null;
}

export async function approveItemSubmission(id: string): Promise<ItemSubmissionResult> {
  const db = await getDb();
  const [submission] = await db
    .select()
    .from(itemSubmissions)
    .where(eq(itemSubmissions.id, id));
  if (!submission) return { ok: false, error: "Submission not found." };
  if (submission.status !== "pending") {
    return { ok: false, error: "Only pending submissions can be approved." };
  }

  // Exclude the submission itself from duplicate check
  const slugDup = await detectDuplicateSlug(
    submission.directoryId,
    submission.slug,
    submission.id,
  );
  if (slugDup.duplicate) {
    return { ok: false, error: "An item with this slug already exists." };
  }

  const itemId = crypto.randomUUID();
  await db.insert(items).values({
    id: itemId,
    directoryId: submission.directoryId,
    slug: submission.slug,
    name: submission.name,
    description: submission.description,
    websiteUrl: submission.websiteUrl,
  });

  await db
    .update(itemSubmissions)
    .set({
      status: "approved",
      moderatorNote: "Approved into public directory.",
      moderatedAt: new Date(),
    })
    .where(eq(itemSubmissions.id, id));

  return { ok: true, id: itemId };
}

export async function rejectItemSubmission(
  id: string,
  note: string,
): Promise<ItemSubmissionResult> {
  const db = await getDb();
  const [submission] = await db
    .select({ id: itemSubmissions.id, status: itemSubmissions.status })
    .from(itemSubmissions)
    .where(eq(itemSubmissions.id, id));
  if (!submission) return { ok: false, error: "Submission not found." };
  if (submission.status !== "pending") {
    return { ok: false, error: "Only pending submissions can be rejected." };
  }

  await db
    .update(itemSubmissions)
    .set({
      status: "rejected",
      moderatorNote: note.trim() || "Rejected by moderator.",
      moderatedAt: new Date(),
    })
    .where(eq(itemSubmissions.id, id));

  return { ok: true, id };
}

export async function mergeItemSubmission(id: string): Promise<ItemSubmissionResult> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(itemSubmissions)
    .where(eq(itemSubmissions.id, id));
  if (!row) return { ok: false, error: "Submission not found." };
  if (row.status !== "pending") {
    return { ok: false, error: "Only pending submissions can be merged." };
  }

  // Rebuild a minimal ItemSubmission-like for findMergeTarget (it only needs directoryId, slug, name, websiteUrl)
  const submissionForMerge: ItemSubmission = {
    id: row.id,
    directorySlug: "", // not used
    directoryId: row.directoryId,
    slug: row.slug,
    name: row.name,
    description: row.description,
    websiteUrl: row.websiteUrl,
    submitterVisitorId: row.submitterVisitorId ?? null,
    submitterName: row.submitterName ?? null,
    submitterEmail: row.submitterEmail ?? null,
    status: row.status as ItemSubmissionStatus,
    mergedIntoItemId: row.mergedIntoItemId ?? null,
    mergedIntoItemSlug: null,
    moderatorNote: row.moderatorNote ?? null,
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
    moderatedAt: row.moderatedAt ? (row.moderatedAt instanceof Date ? row.moderatedAt : new Date(row.moderatedAt)) : null,
    source: "visitor",
  };

  const target = await findMergeTarget(submissionForMerge);
  if (!target) {
    return { ok: false, error: "No matching live item found to merge into." };
  }

  await db
    .update(itemSubmissions)
    .set({
      status: "merged",
      mergedIntoItemId: target.itemId,
      moderatorNote: `Merged into existing item /d/${(await db.select({slug: directories.slug}).from(directories).where(eq(directories.id, row.directoryId)))[0]?.slug || "ai-dev-tools"}/${target.slug}.`,
      moderatedAt: new Date(),
    })
    .where(eq(itemSubmissions.id, id));

  return { ok: true, id: target.itemId };
}

/** Roll back an approved submission by removing the item when it has no ratings. */
export async function rollbackApprovedItemSubmission(
  id: string,
  note: string,
): Promise<ItemSubmissionResult> {
  const db = await getDb();
  const [submission] = await db
    .select()
    .from(itemSubmissions)
    .where(eq(itemSubmissions.id, id));
  if (!submission) return { ok: false, error: "Submission not found." };
  if (submission.status !== "approved") {
    return { ok: false, error: "Only approved submissions can be rolled back." };
  }

  const [liveItem] = await db
    .select({ id: items.id })
    .from(items)
    .where(
      and(eq(items.directoryId, submission.directoryId), eq(items.slug, submission.slug)),
    );
  if (!liveItem) {
    await db
      .update(itemSubmissions)
      .set({
        status: "rejected",
        moderatorNote: note.trim() || "Rolled back — item row missing.",
        moderatedAt: new Date(),
      })
      .where(eq(itemSubmissions.id, id));
    return { ok: true, id };
  }

  const existingRatings = await db
    .select({ id: ratings.id })
    .from(ratings)
    .where(eq(ratings.itemId, liveItem.id));
  if (existingRatings.length > 0) {
    return {
      ok: false,
      error: "Cannot roll back — this item already has ratings. Hide manually later.",
    };
  }

  await db.delete(items).where(eq(items.id, liveItem.id));
  await db
    .update(itemSubmissions)
    .set({
      status: "rejected",
      moderatorNote: note.trim() || "Rolled back — removed approved item with no ratings yet.",
      moderatedAt: new Date(),
    })
    .where(eq(itemSubmissions.id, id));
  return { ok: true, id: liveItem.id };
}

/** Seed helper: load the fixture rows into item_submissions as pending (idempotent by id).
 * Call after migrate, e.g. via tsx one-off or extend seed-d1.
 * Safe to run multiple times.
 */
export async function loadItemSubmissionFixtures(): Promise<void> {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const candidates = [
    join(process.cwd(), "fixtures/item-submissions-ai-dev-tools.json"),
    join(process.cwd(), "../../fixtures/item-submissions-ai-dev-tools.json"),
  ];
  let fixtureRows: any[] = [];
  for (const p of candidates) {
    try {
      fixtureRows = JSON.parse(readFileSync(p, "utf8"));
      break;
    } catch {}
  }
  if (!fixtureRows.length) return;

  const db = await getDb();
  const [dir] = await db
    .select({ id: directories.id })
    .from(directories)
    .where(eq(directories.slug, PILOT_DIRECTORY_SLUG));
  if (!dir) return;

  for (const f of fixtureRows) {
    if (f.directorySlug !== PILOT_DIRECTORY_SLUG) continue;
    // upsert by id (or skip if exists)
    const existing = await db
      .select({ id: itemSubmissions.id })
      .from(itemSubmissions)
      .where(eq(itemSubmissions.id, f.id));
    if (existing.length) continue;

    await db.insert(itemSubmissions).values({
      id: f.id,
      directoryId: dir.id,
      slug: f.slug,
      name: f.name,
      description: f.description,
      websiteUrl: f.websiteUrl,
      submitterVisitorId: null,
      submitterName: f.submitterName ?? null,
      submitterEmail: f.submitterEmail ?? null,
      status: f.status || "pending",
      mergedIntoItemId: null,
      moderatorNote: null,
      createdAt: new Date(),
      moderatedAt: null,
    });
  }
}
