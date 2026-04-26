#!/usr/bin/env tsx
/**
 * Seed D1 — 10 AI dev tools, 5 aspects, seed-owner ratings.
 *
 * Generates a SQL file and executes it via wrangler. Mirrors high-signal's
 * scripts/seed-d1.ts pattern.
 *
 *   pnpm tsx scripts/seed-d1.ts --local
 *   pnpm tsx scripts/seed-d1.ts --remote
 */

import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TMP_DIR = resolve(__root, ".tmp");
const TMP_SQL = resolve(TMP_DIR, "seed.sql");
const flag = process.argv.includes("--remote") ? "--remote" : "--local";

const ASPECTS = [
  { key: "speed", label: "Speed", description: "Latency and how fast it responds." },
  { key: "accuracy", label: "Accuracy", description: "Quality and correctness of suggestions." },
  { key: "cost", label: "Cost", description: "Value relative to price (5 = great deal)." },
  { key: "ergonomics", label: "Ergonomics", description: "How nice it feels to use day-to-day." },
  {
    key: "integration_depth",
    label: "Integration depth",
    description: "Editor, CLI, and tooling reach.",
  },
] as const;

type AspectKey = (typeof ASPECTS)[number]["key"];

type SeedItem = {
  slug: string;
  name: string;
  description: string;
  websiteUrl: string;
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
    description:
      "Open-source AI coding assistant for VS Code and JetBrains; bring-your-own-model.",
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

function esc(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

function buildSql(): string {
  const out: string[] = [];
  const now = Date.now();

  // Aspects
  const aspectIds: Record<string, string> = {};
  ASPECTS.forEach((a, i) => {
    const id = randomUUID();
    aspectIds[a.key] = id;
    out.push(
      `INSERT INTO aspects (id, key, label, description, sort_order) VALUES (${esc(id)}, ${esc(a.key)}, ${esc(a.label)}, ${esc(a.description)}, ${i}) ON CONFLICT(key) DO UPDATE SET label=excluded.label, description=excluded.description, sort_order=excluded.sort_order;`,
    );
  });

  // Items + ratings
  for (const it of ITEMS) {
    const itemId = randomUUID();
    out.push(
      `INSERT INTO items (id, slug, name, description, category, website_url, logo_url, created_at) VALUES (${esc(itemId)}, ${esc(it.slug)}, ${esc(it.name)}, ${esc(it.description)}, ${esc("ai-dev-tools")}, ${esc(it.websiteUrl)}, NULL, ${now}) ON CONFLICT(slug) DO UPDATE SET name=excluded.name, description=excluded.description, website_url=excluded.website_url;`,
    );

    for (const [key, score] of Object.entries(it.scores) as [AspectKey, number][]) {
      const aspectId = aspectIds[key];
      const ratingId = randomUUID();
      // Use a sub-select for item id to handle existing rows (where itemId above won't be the persisted one).
      out.push(
        `INSERT INTO ratings (id, item_id, aspect_id, visitor_id, score, created_at) SELECT ${esc(ratingId)}, items.id, aspects.id, ${esc(SEED_VISITOR)}, ${score}, ${now} FROM items, aspects WHERE items.slug = ${esc(it.slug)} AND aspects.key = ${esc(key)} ON CONFLICT(item_id, aspect_id, visitor_id) DO UPDATE SET score=excluded.score;`,
      );
    }
  }

  return out.join("\n") + "\n";
}

function run() {
  const sql = buildSql();
  mkdirSync(TMP_DIR, { recursive: true });
  writeFileSync(TMP_SQL, sql);
  console.log(`[seed] wrote ${TMP_SQL} (${sql.split("\n").length - 1} statements)`);

  const args = [
    "d1",
    "execute",
    "everythingrated-db",
    flag,
    `--file=${TMP_SQL}`,
    "--config=apps/web/wrangler.toml",
  ];
  console.log(`[seed] wrangler ${args.join(" ")}`);
  const proc = spawn("wrangler", args, { stdio: "inherit", cwd: __root });
  proc.on("close", (code) => process.exit(code ?? 0));
}

run();
