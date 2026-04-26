import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import "dotenv/config";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { aspects, items, ratings } from "./schema";
import { randomUUID } from "node:crypto";

const REPO_ROOT_DB = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../local.db",
);

// ─────────────────────────────────────────────
// Seed data — 10 AI dev tools, 5 aspects, owner ratings.
// Owner ratings are author opinion; the POC's job is to prove the
// multi-axis UX, so a few seeded scores keep the page non-empty.
// ─────────────────────────────────────────────

const ASPECTS = [
  { key: "speed", label: "Speed", description: "Latency and how fast it responds." },
  { key: "accuracy", label: "Accuracy", description: "Quality and correctness of suggestions." },
  { key: "cost", label: "Cost", description: "Value relative to price (5 = great deal)." },
  { key: "ergonomics", label: "Ergonomics", description: "How nice it feels to use day-to-day." },
  { key: "integration_depth", label: "Integration depth", description: "Editor, CLI, and tooling reach." },
] as const;

type AspectKey = (typeof ASPECTS)[number]["key"];

type SeedItem = {
  slug: string;
  name: string;
  description: string;
  websiteUrl: string;
  logoUrl?: string;
  scores: Record<AspectKey, number>;
};

const ITEMS: SeedItem[] = [
  {
    slug: "cursor",
    name: "Cursor",
    description: "AI-first fork of VS Code with composer-style edits and agent mode.",
    websiteUrl: "https://cursor.com",
    scores: { speed: 4, accuracy: 4, cost: 3, ergonomics: 5, integration_depth: 5 },
  },
  {
    slug: "claude-code",
    name: "Claude Code",
    description: "Anthropic's terminal-native coding agent with strong long-context reasoning.",
    websiteUrl: "https://claude.com/claude-code",
    scores: { speed: 4, accuracy: 5, cost: 3, ergonomics: 5, integration_depth: 4 },
  },
  {
    slug: "windsurf",
    name: "Windsurf",
    description: "Codeium's AI editor with Cascade agent and flow awareness.",
    websiteUrl: "https://windsurf.com",
    scores: { speed: 4, accuracy: 4, cost: 4, ergonomics: 4, integration_depth: 4 },
  },
  {
    slug: "github-copilot",
    name: "GitHub Copilot",
    description: "The original inline AI completion, now with chat and agent modes.",
    websiteUrl: "https://github.com/features/copilot",
    scores: { speed: 5, accuracy: 3, cost: 5, ergonomics: 4, integration_depth: 5 },
  },
  {
    slug: "aider",
    name: "Aider",
    description: "Open-source AI pair programmer in your terminal with git-aware edits.",
    websiteUrl: "https://aider.chat",
    scores: { speed: 4, accuracy: 4, cost: 4, ergonomics: 3, integration_depth: 3 },
  },
  {
    slug: "cline",
    name: "Cline",
    description: "Autonomous coding agent for VS Code with planning and approval flows.",
    websiteUrl: "https://cline.bot",
    scores: { speed: 3, accuracy: 4, cost: 3, ergonomics: 4, integration_depth: 3 },
  },
  {
    slug: "continue",
    name: "Continue",
    description: "Open-source AI coding assistant for VS Code and JetBrains; bring-your-own-model.",
    websiteUrl: "https://continue.dev",
    scores: { speed: 4, accuracy: 3, cost: 5, ergonomics: 4, integration_depth: 4 },
  },
  {
    slug: "codeium",
    name: "Codeium",
    description: "Free-tier AI completion + chat across 70+ languages and many editors.",
    websiteUrl: "https://codeium.com",
    scores: { speed: 5, accuracy: 3, cost: 5, ergonomics: 4, integration_depth: 5 },
  },
  {
    slug: "tabnine",
    name: "Tabnine",
    description: "Privacy-focused AI completion with local and self-hosted models.",
    websiteUrl: "https://tabnine.com",
    scores: { speed: 4, accuracy: 3, cost: 4, ergonomics: 3, integration_depth: 4 },
  },
  {
    slug: "sourcegraph-cody",
    name: "Sourcegraph Cody",
    description: "Codebase-aware AI assistant grounded in Sourcegraph's code graph.",
    websiteUrl: "https://sourcegraph.com/cody",
    scores: { speed: 3, accuracy: 4, cost: 3, ergonomics: 3, integration_depth: 4 },
  },
];

const SEED_VISITOR = "seed-owner";

async function main() {
  const url = process.env.TURSO_CONNECTION_URL ?? `file:${REPO_ROOT_DB}`;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const client = createClient({ url, authToken });
  const db = drizzle(client);

  console.log("seeding aspects…");
  const aspectIds: Record<string, string> = {};
  for (let i = 0; i < ASPECTS.length; i++) {
    const a = ASPECTS[i];
    const id = randomUUID();
    aspectIds[a.key] = id;
    await db
      .insert(aspects)
      .values({ id, key: a.key, label: a.label, description: a.description, sortOrder: i })
      .onConflictDoUpdate({
        target: aspects.key,
        set: { label: a.label, description: a.description, sortOrder: i },
      });
  }

  // Re-fetch ids in case rows already existed.
  const existingAspects = await db.select().from(aspects);
  for (const a of existingAspects) aspectIds[a.key] = a.id;

  console.log("seeding items + owner ratings…");
  for (const it of ITEMS) {
    const itemId = randomUUID();
    await db
      .insert(items)
      .values({
        id: itemId,
        slug: it.slug,
        name: it.name,
        description: it.description,
        category: "ai-dev-tools",
        websiteUrl: it.websiteUrl,
        logoUrl: it.logoUrl ?? null,
      })
      .onConflictDoUpdate({
        target: items.slug,
        set: {
          name: it.name,
          description: it.description,
          websiteUrl: it.websiteUrl,
        },
      });

    // Ensure we have the persisted id (insert may have been a conflict).
    const [row] = await db.select().from(items).where(eq(items.slug, it.slug));
    const persistedItemId = row.id;

    for (const [key, score] of Object.entries(it.scores) as [AspectKey, number][]) {
      const aspectId = aspectIds[key];
      if (!aspectId) continue;
      await db
        .insert(ratings)
        .values({
          id: randomUUID(),
          itemId: persistedItemId,
          aspectId,
          visitorId: SEED_VISITOR,
          score,
        })
        .onConflictDoUpdate({
          target: [ratings.itemId, ratings.aspectId, ratings.visitorId],
          set: { score },
        });
    }
  }

  console.log(`seeded ${ITEMS.length} items × ${ASPECTS.length} aspects.`);
  process.exit(0);
}

import { eq } from "drizzle-orm";

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
