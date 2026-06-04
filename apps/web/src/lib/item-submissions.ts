import { directories, items, ratings } from "@everythingrated/db";
import { and, eq } from "drizzle-orm";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getDb } from "./db";
import { readVisitorId } from "./visitor";

export const PILOT_DIRECTORY_SLUG = "ai-dev-tools";
const MAX_TEXT_LENGTH = 500;
const MIN_DESCRIPTION_LENGTH = 20;
const MAX_PENDING_PER_VISITOR_PER_DAY = 3;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ItemSubmissionStatus = "pending" | "approved" | "rejected" | "merged";

export type ItemSubmissionSource = "fixture" | "visitor";

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
  source: ItemSubmissionSource;
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

type FixtureRow = {
  id: string;
  directorySlug: string;
  slug: string;
  name: string;
  description: string;
  websiteUrl: string;
  submitterName: string | null;
  submitterEmail: string | null;
  status: ItemSubmissionStatus;
};

const queue: ItemSubmission[] = [];
let queueBootstrapped = false;

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
): Promise<{ duplicate: boolean; existingItemSlug?: string }> {
  await ensureQueueLoaded();
  const db = await getDb();
  const [liveItem] = await db
    .select({ slug: items.slug })
    .from(items)
    .where(and(eq(items.directoryId, directoryId), eq(items.slug, slug)));
  if (liveItem) {
    return { duplicate: true, existingItemSlug: liveItem.slug };
  }

  const queued = queue.find(
    (row) =>
      row.directoryId === directoryId &&
      row.slug === slug &&
      (row.status === "pending" || row.status === "approved"),
  );
  if (queued) {
    return { duplicate: true, existingItemSlug: queued.slug };
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

  await ensureQueueLoaded();
  for (const row of queue) {
    if (row.directoryId !== directoryId) continue;
    if (row.status !== "pending" && row.status !== "approved") continue;
    if (normalizeItemName(row.name) === normalized) {
      return { duplicate: true, existingItemSlug: row.slug };
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

  await ensureQueueLoaded();
  for (const row of queue) {
    if (row.directoryId !== directoryId) continue;
    if (row.status !== "pending" && row.status !== "approved") continue;
    if (parseWebsiteHost(row.websiteUrl) === host) {
      return { duplicate: true, existingItemSlug: row.slug, host };
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

function loadFixtureRows(): FixtureRow[] {
  const candidates = [
    join(process.cwd(), "fixtures/item-submissions-ai-dev-tools.json"),
    join(process.cwd(), "../../fixtures/item-submissions-ai-dev-tools.json"),
  ];
  for (const path of candidates) {
    try {
      const raw = readFileSync(path, "utf8");
      return JSON.parse(raw) as FixtureRow[];
    } catch {
      // try next path
    }
  }
  return [];
}

async function ensureQueueLoaded(): Promise<void> {
  if (queueBootstrapped) return;
  queueBootstrapped = true;

  const db = await getDb();
  const [directory] = await db
    .select()
    .from(directories)
    .where(eq(directories.slug, PILOT_DIRECTORY_SLUG));
  if (!directory) return;

  const rows = loadFixtureRows();
  const now = new Date();
  for (const row of rows) {
    if (row.directorySlug !== PILOT_DIRECTORY_SLUG) continue;
    queue.push({
      id: row.id,
      directorySlug: row.directorySlug,
      directoryId: directory.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      websiteUrl: row.websiteUrl,
      submitterVisitorId: null,
      submitterName: row.submitterName,
      submitterEmail: row.submitterEmail,
      status: row.status,
      mergedIntoItemId: null,
      mergedIntoItemSlug: null,
      moderatorNote: null,
      createdAt: now,
      moderatedAt: null,
      source: "fixture",
    });
  }
}

export async function listItemSubmissions(
  directorySlug = PILOT_DIRECTORY_SLUG,
  status?: ItemSubmissionStatus,
): Promise<ItemSubmission[]> {
  await ensureQueueLoaded();
  const rows = queue
    .filter((row) => row.directorySlug === directorySlug)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  if (!status) return rows;
  return rows.filter((row) => row.status === status);
}

function countRecentPendingForVisitor(
  visitorId: string,
  directoryId: string,
): number {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  return queue.filter(
    (row) =>
      row.directoryId === directoryId &&
      row.submitterVisitorId === visitorId &&
      row.status === "pending" &&
      row.createdAt.getTime() >= dayAgo,
  ).length;
}

export async function submitItemSuggestion(
  input: ItemSubmissionInput,
): Promise<ItemSubmissionResult> {
  const validation = validateItemSubmission(input);
  if (!validation.ok) return validation;

  await ensureQueueLoaded();

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
  if (visitorId && countRecentPendingForVisitor(visitorId, directory.id) >= MAX_PENDING_PER_VISITOR_PER_DAY) {
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
  queue.push({
    id,
    directorySlug: directory.slug,
    directoryId: directory.id,
    slug,
    name,
    description: input.description.trim(),
    websiteUrl,
    submitterVisitorId: visitorId,
    submitterName: input.submitterName?.trim() || null,
    submitterEmail: input.submitterEmail?.trim() || null,
    status: "pending",
    mergedIntoItemId: null,
    mergedIntoItemSlug: null,
    moderatorNote: null,
    createdAt: new Date(),
    moderatedAt: null,
    source: "visitor",
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
  await ensureQueueLoaded();
  const submission = queue.find((row) => row.id === id);
  if (!submission) return { ok: false, error: "Submission not found." };
  if (submission.status !== "pending") {
    return { ok: false, error: "Only pending submissions can be approved." };
  }

  const slugDup = await detectDuplicateSlug(submission.directoryId, submission.slug);
  if (slugDup.duplicate) {
    return { ok: false, error: "An item with this slug already exists." };
  }

  const db = await getDb();
  const itemId = crypto.randomUUID();
  await db.insert(items).values({
    id: itemId,
    directoryId: submission.directoryId,
    slug: submission.slug,
    name: submission.name,
    description: submission.description,
    websiteUrl: submission.websiteUrl,
  });

  submission.status = "approved";
  submission.moderatorNote = "Approved into public directory.";
  submission.moderatedAt = new Date();

  return { ok: true, id: itemId };
}

export async function rejectItemSubmission(
  id: string,
  note: string,
): Promise<ItemSubmissionResult> {
  await ensureQueueLoaded();
  const submission = queue.find((row) => row.id === id);
  if (!submission) return { ok: false, error: "Submission not found." };
  if (submission.status !== "pending") {
    return { ok: false, error: "Only pending submissions can be rejected." };
  }

  submission.status = "rejected";
  submission.moderatorNote = note.trim() || "Rejected by moderator.";
  submission.moderatedAt = new Date();
  return { ok: true, id };
}

export async function mergeItemSubmission(id: string): Promise<ItemSubmissionResult> {
  await ensureQueueLoaded();
  const submission = queue.find((row) => row.id === id);
  if (!submission) return { ok: false, error: "Submission not found." };
  if (submission.status !== "pending") {
    return { ok: false, error: "Only pending submissions can be merged." };
  }

  const target = await findMergeTarget(submission);
  if (!target) {
    return { ok: false, error: "No matching live item found to merge into." };
  }

  submission.status = "merged";
  submission.mergedIntoItemId = target.itemId;
  submission.mergedIntoItemSlug = target.slug;
  submission.moderatorNote = `Merged into existing item /d/${submission.directorySlug}/${target.slug}.`;
  submission.moderatedAt = new Date();
  return { ok: true, id: target.itemId };
}

/** Roll back an approved submission by removing the item when it has no ratings. */
export async function rollbackApprovedItemSubmission(
  id: string,
  note: string,
): Promise<ItemSubmissionResult> {
  await ensureQueueLoaded();
  const submission = queue.find((row) => row.id === id);
  if (!submission) return { ok: false, error: "Submission not found." };
  if (submission.status !== "approved") {
    return { ok: false, error: "Only approved submissions can be rolled back." };
  }

  const db = await getDb();
  const [liveItem] = await db
    .select({ id: items.id })
    .from(items)
    .where(
      and(eq(items.directoryId, submission.directoryId), eq(items.slug, submission.slug)),
    );
  if (!liveItem) {
    submission.status = "rejected";
    submission.moderatorNote = note.trim() || "Rolled back — item row missing.";
    submission.moderatedAt = new Date();
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
  submission.status = "rejected";
  submission.moderatorNote =
    note.trim() || "Rolled back — removed approved item with no ratings yet.";
  submission.moderatedAt = new Date();
  return { ok: true, id: liveItem.id };
}

/** Test-only reset — clears runtime queue so fixtures reload. */
export function resetItemSubmissionQueueForTests(): void {
  queue.length = 0;
  queueBootstrapped = false;
}
