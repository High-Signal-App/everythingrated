#!/usr/bin/env tsx
/**
 * Merge web-sourced catalogue fragments → scripts/catalogue-extra.json.
 *
 * Each research agent writes one fragment in scripts/catalogue-fragments/*.json
 * shaped like the ExtraCatalogue ({ deepen?, newDirectories? }). This combines
 * them: deepen maps are concatenated per directory, newDirectories appended.
 * Item slugs are deduped globally (first wins) so the same tool can't land
 * twice; dropped dups are reported.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FRAG_DIR = resolve(__root, "scripts/catalogue-fragments");
const OUT = resolve(__root, "scripts/catalogue-extra.json");

type Item = { slug: string; [k: string]: unknown };
type Catalogue = {
  deepen?: Record<string, Item[]>;
  newDirectories?: Array<{ slug: string; items: Item[]; [k: string]: unknown }>;
};

const merged: Required<Catalogue> = { deepen: {}, newDirectories: [] };
const seenItemSlugs = new Set<string>();
let dupCount = 0;
let fragCount = 0;

function takeItems(items: Item[], where: string): Item[] {
  const out: Item[] = [];
  for (const it of items) {
    if (!it || typeof it.slug !== "string") continue;
    if (seenItemSlugs.has(it.slug)) {
      dupCount++;
      continue;
    }
    seenItemSlugs.add(it.slug);
    out.push(it);
  }
  return out;
}

if (existsSync(FRAG_DIR)) {
  for (const file of readdirSync(FRAG_DIR).filter((f) => f.endsWith(".json")).sort()) {
    let frag: Catalogue;
    try {
      frag = JSON.parse(readFileSync(resolve(FRAG_DIR, file), "utf8"));
    } catch (e) {
      console.error(`[merge] SKIP ${file}: invalid JSON — ${(e as Error).message}`);
      continue;
    }
    fragCount++;
    for (const [dirSlug, items] of Object.entries(frag.deepen ?? {})) {
      const kept = takeItems(items, `${file}:deepen:${dirSlug}`);
      merged.deepen[dirSlug] = [...(merged.deepen[dirSlug] ?? []), ...kept];
    }
    for (const nd of frag.newDirectories ?? []) {
      const existing = merged.newDirectories.find((d) => d.slug === nd.slug);
      if (existing) {
        existing.items.push(...takeItems(nd.items ?? [], `${file}:newDir:${nd.slug}`));
      } else {
        merged.newDirectories.push({ ...nd, items: takeItems(nd.items ?? [], `${file}:newDir:${nd.slug}`) });
      }
    }
  }
}

const deepenItems = Object.values(merged.deepen).reduce((s, a) => s + a.length, 0);
const newDirItems = merged.newDirectories.reduce((s, d) => s + d.items.length, 0);

writeFileSync(OUT, JSON.stringify(merged, null, 2) + "\n");
console.log(
  `[merge] ${fragCount} fragments → ${OUT}\n` +
    `  deepen: ${Object.keys(merged.deepen).length} directories, ${deepenItems} items\n` +
    `  new directories: ${merged.newDirectories.length} (${newDirItems} items)\n` +
    `  total new items: ${deepenItems + newDirItems}  (deduped ${dupCount})`,
);
