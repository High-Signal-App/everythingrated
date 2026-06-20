#!/usr/bin/env node
/**
 * Evidence-grounding: fetch real adoption signals for package-backed dev tools
 * and recompute the "ecosystem" axis from them.
 *
 *   node scripts/fetch-signals.mjs
 *
 * Reads scripts/catalogue-resolution.json ({slug:{directory,github,registry,pkg}}),
 * fetches GitHub stars + last-push and native-registry weekly downloads
 * (npm / PyPI / crates / NuGet), then writes:
 *   - scripts/catalogue-signals.json   (raw evidence + timestamps; committed)
 *   - scripts/catalogue-grounded.json   (slugs whose ecosystem score is grounded)
 *   - merges ecosystem scores into scripts/catalogue-overrides.json
 *
 * Ecosystem score = rank (within directory) of a composite adoption index:
 *   idx = log10(weekly_downloads)  when a package exists,
 *       = log10(stars) + 2.5       for package-less tools (Go modules etc.),
 *   mapped to 1..5 by quintile within the directory. Items with no signal
 *   (no repo, no package) are left as their AI estimate (not grounded).
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RES = resolve(ROOT, "scripts/catalogue-resolution.json");
const SIGNALS = resolve(ROOT, "scripts/catalogue-signals.json");
const GROUNDED = resolve(ROOT, "scripts/catalogue-grounded.json");
const OVERRIDES = resolve(ROOT, "scripts/catalogue-overrides.json");
const STARS_BRIDGE = 2.5; // calibrates log10(stars) onto the log10(weekly-downloads) scale

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, headers = {}) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "everythingrated-signals", ...headers } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function ghRepo(repo) {
  try {
    const out = execSync(`gh api repos/${repo} --jq '{stars:.stargazers_count,pushed:.pushed_at}'`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return JSON.parse(out);
  } catch {
    return null;
  }
}

async function weeklyDownloads(registry, pkg) {
  if (!registry || !pkg) return null;
  if (registry === "npm") {
    const d = await getJson(`https://api.npmjs.org/downloads/point/last-week/${pkg}`);
    return d?.downloads ?? null;
  }
  if (registry === "pypi") {
    await sleep(1200); // pypistats rate-limits; be polite
    const d = await getJson(`https://pypistats.org/api/packages/${pkg.toLowerCase()}/recent`);
    return d?.data?.last_week ?? null;
  }
  if (registry === "crates") {
    await sleep(300);
    const d = await getJson(`https://crates.io/api/v1/crates/${pkg}`);
    const recent90 = d?.crate?.recent_downloads;
    return recent90 ? Math.round(recent90 / 13) : null; // ~weekly from 90d
  }
  if (registry === "nuget") {
    const d = await getJson(`https://azuresearch-usnc.nuget.org/query?q=packageid:${pkg.toLowerCase()}`);
    const total = d?.data?.[0]?.totalDownloads;
    return total ? Math.round(total / 260) : null; // rough weekly from ~5yr total
  }
  return null; // "go" and anything else: no central download count
}

const resolution = JSON.parse(readFileSync(RES, "utf8"));
const slugs = Object.keys(resolution);
const fetchedAt = new Date().toISOString();
const signals = {};

console.log(`[signals] fetching for ${slugs.length} items...`);
let i = 0;
for (const slug of slugs) {
  const { directory, github, registry, pkg } = resolution[slug];
  const gh = github ? ghRepo(github) : null;
  const dl = await weeklyDownloads(registry, pkg);
  signals[slug] = {
    directory,
    github: github ?? null,
    registry: registry ?? null,
    pkg: pkg ?? null,
    stars: gh?.stars ?? null,
    lastPush: gh?.pushed ?? null,
    weeklyDownloads: dl,
    fetchedAt,
  };
  if (++i % 40 === 0) console.log(`[signals]   ${i}/${slugs.length}`);
}
writeFileSync(SIGNALS, JSON.stringify(signals, null, 1) + "\n");
console.log(`[signals] wrote ${SIGNALS}`);

// composite adoption index
function idxOf(s) {
  if (s.weeklyDownloads && s.weeklyDownloads > 0) return Math.log10(s.weeklyDownloads);
  if (s.stars && s.stars > 0) return Math.log10(s.stars) + STARS_BRIDGE;
  return null;
}

// group by directory, rank grounded items -> 1..5 ecosystem
const byDir = {};
for (const [slug, s] of Object.entries(signals)) {
  (byDir[s.directory] ??= []).push([slug, idxOf(s)]);
}
const ecoScores = {}; // slug -> 1..5
const grounded = [];
for (const [dir, items] of Object.entries(byDir)) {
  const ranked = items.filter(([, idx]) => idx != null).sort((a, b) => b[1] - a[1]);
  const n = ranked.length;
  ranked.forEach(([slug], rank) => {
    const score = Math.max(1, Math.min(5, 5 - Math.floor((rank * 5) / n)));
    ecoScores[slug] = score;
    grounded.push(slug);
  });
}

// merge into overrides (preserve existing aspects), set ecosystem
const overrides = existsSync(OVERRIDES) ? JSON.parse(readFileSync(OVERRIDES, "utf8")) : {};
for (const [slug, score] of Object.entries(ecoScores)) {
  overrides[slug] = { ...(overrides[slug] ?? {}), ecosystem: score };
}
writeFileSync(OVERRIDES, JSON.stringify(overrides, null, 1) + "\n");
writeFileSync(GROUNDED, JSON.stringify(grounded.sort(), null, 1) + "\n");
console.log(
  `[signals] grounded ecosystem for ${grounded.length} items across ${Object.keys(byDir).length} directories; merged into overrides`,
);
