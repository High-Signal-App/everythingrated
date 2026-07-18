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
 *
 * --- Resilience (PRD 02-provider-runtime) -----------------------------------
 * Manual-only per ADR-0004. Hardened so that if it is ever automated it
 * cannot create unbounded provider work:
 *   - Per-call timeout (10s) via AbortSignal on every fetch and execSync.
 *   - Bounded retry: 2 attempts, exponential backoff with full jitter, only
 *     for 429 / 5xx / timeout. Non-retryable 4xx (except 429) fail fast.
 *   - Concurrency cap: items processed in chunks of CHUNK_SIZE (sequential
 *     within a chunk, bounded fan-out if ever parallelized).
 *   - Per-run item budget: MAX_ITEMS per run; excess items are skipped with
 *     an inspectable failure reason.
 *   - Idempotency: a per-item signature hash ({github,registry,pkg}) is
 *     stored alongside each signal; re-runs reuse stored signals whose
 *     signature is unchanged, so unchanged items are not re-fetched. A
 *     catalogue version hash is logged for telemetry.
 *   - Bounded, secret-free telemetry: item count, success/fail counts,
 *     latency buckets. No tokens or API keys are logged.
 * Existing PyPI (1200ms) and crates (300ms) politeness sleeps are preserved.
 */

import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RES = resolve(ROOT, 'scripts/catalogue-resolution.json');
const SIGNALS = resolve(ROOT, 'scripts/catalogue-signals.json');
const GROUNDED = resolve(ROOT, 'scripts/catalogue-grounded.json');
const OVERRIDES = resolve(ROOT, 'scripts/catalogue-overrides.json');
const STARS_BRIDGE = 2.5; // calibrates log10(stars) onto the log10(weekly-downloads) scale

// --- Resilience constants --------------------------------------------------
const CALL_TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 2;
const BASE_BACKOFF_MS = 500;
const CHUNK_SIZE = 10;
const MAX_ITEMS = 200;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Full-jitter backoff: uniform random in [0, base * 2^(attempt-1)].
export function jitterBackoff(attempt, base = BASE_BACKOFF_MS) {
  const cap = base * 2 ** (attempt - 1);
  return Math.floor(Math.random() * cap);
}

export function isRetryableStatus(status) {
  return status === 429 || (status >= 500 && status < 600);
}

/**
 * Fetch JSON with per-call timeout (AbortSignal) and bounded retry.
 * Retries only 429 / 5xx / timeout. Non-retryable 4xx fails fast.
 * Returns parsed JSON on success; throws a classified error on terminal
 * failure (caller decides whether to degrade).
 */
export async function fetchWithRetry(url, opts = {}) {
  const {
    headers = {},
    timeoutMs = CALL_TIMEOUT_MS,
    maxAttempts = MAX_ATTEMPTS,
    fetchImpl = fetch,
  } = opts;
  const reqHeaders = { 'User-Agent': 'everythingrated-signals', ...headers };
  let lastErr = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), timeoutMs);
    let res;
    try {
      res = await fetchImpl(url, { headers: reqHeaders, signal: ac.signal });
      clearTimeout(to);
    } catch (e) {
      clearTimeout(to);
      const aborted = e?.name === 'AbortError' || /abort/i.test(e?.name ?? '');
      const timedOut = aborted || /timeout/i.test(e?.message ?? '');
      lastErr = e;
      if (attempt < maxAttempts) {
        await sleep(jitterBackoff(attempt));
        continue;
      }
      const err = new Error(
        timedOut
          ? `timeout after ${timeoutMs}ms for ${url}`
          : `network error for ${url}: ${e?.message ?? e}`
      );
      err.status = null;
      err.retryable = true;
      err.timedOut = timedOut;
      throw err;
    }
    if (res.ok) return await res.json();
    if (isRetryableStatus(res.status) && attempt < maxAttempts) {
      await sleep(jitterBackoff(attempt));
      continue;
    }
    const err = new Error(`HTTP ${res.status} for ${url}`);
    err.status = res.status;
    err.retryable = false;
    err.timedOut = false;
    throw err;
  }
  throw lastErr ?? new Error(`unreachable retry state for ${url}`);
}

/**
 * Degrading JSON fetch: returns parsed JSON or null on terminal failure.
 * Used by per-item signal collection so one bad provider does not abort the
 * whole run. Records the failure reason on the optional telemetry sink.
 */
export async function getJson(url, opts = {}, onFail = null) {
  try {
    return await fetchWithRetry(url, opts);
  } catch (e) {
    onFail?.({
      url,
      status: e?.status ?? null,
      retryable: e?.retryable ?? false,
      timedOut: e?.timedOut ?? false,
      message: e?.message ?? String(e),
    });
    return null;
  }
}

/**
 * GitHub repo metadata via `gh` CLI. execSync is given a hard timeout so a
 * hung gh process cannot block the run. Returns {stars,pushed} or null.
 */
export function ghRepo(repo, opts = {}) {
  const { timeoutMs = CALL_TIMEOUT_MS, execSyncImpl = execSync } = opts;
  try {
    const out = execSyncImpl(
      `gh api repos/${repo} --jq '{stars:.stargazers_count,pushed:.pushed_at}'`,
      {
        encoding: 'utf8',
        timeout: timeoutMs,
        stdio: ['ignore', 'pipe', 'ignore'],
      }
    );
    return JSON.parse(out);
  } catch (e) {
    opts.onFail?.({ repo, message: e?.message ?? String(e) });
    return null;
  }
}

/**
 * Weekly downloads for a registry package. Preserves the existing PyPI
 * (1200ms) and crates (300ms) politeness sleeps. Returns a number or null.
 */
export async function weeklyDownloads(registry, pkg, opts = {}) {
  if (!registry || !pkg) return null;
  const fetchOpts = {
    timeoutMs: opts.timeoutMs ?? CALL_TIMEOUT_MS,
    maxAttempts: opts.maxAttempts ?? MAX_ATTEMPTS,
    fetchImpl: opts.fetchImpl,
  };
  const onFail = opts.onFail ?? null;
  if (registry === 'npm') {
    const d = await getJson(
      `https://api.npmjs.org/downloads/point/last-week/${pkg}`,
      fetchOpts,
      onFail
    );
    return d?.downloads ?? null;
  }
  if (registry === 'pypi') {
    await sleep(1200); // pypistats rate-limits; be polite
    const d = await getJson(
      `https://pypistats.org/api/packages/${pkg.toLowerCase()}/recent`,
      fetchOpts,
      onFail
    );
    return d?.data?.last_week ?? null;
  }
  if (registry === 'crates') {
    await sleep(300);
    const d = await getJson(`https://crates.io/api/v1/crates/${pkg}`, fetchOpts, onFail);
    const recent90 = d?.crate?.recent_downloads;
    return recent90 ? Math.round(recent90 / 13) : null; // ~weekly from 90d
  }
  if (registry === 'nuget') {
    const d = await getJson(
      `https://azuresearch-usnc.nuget.org/query?q=packageid:${pkg.toLowerCase()}`,
      fetchOpts,
      onFail
    );
    const total = d?.data?.[0]?.totalDownloads;
    return total ? Math.round(total / 260) : null; // rough weekly from ~5yr total
  }
  return null; // "go" and anything else: no central download count
}

// Per-item signature: hash of the provider-identifying fields. Unchanged
// signature => the stored signal is still valid => skip re-fetch.
export function itemSignature({ github, registry, pkg }) {
  return createHash('sha1')
    .update(JSON.stringify({ github, registry, pkg }))
    .digest('hex')
    .slice(0, 16);
}

// Catalogue version hash: identifies the whole resolution snapshot (telemetry).
export function catalogueHash(resolution) {
  return createHash('sha1').update(JSON.stringify(resolution)).digest('hex').slice(0, 16);
}

// Latency bucket for secret-free telemetry.
function latencyBucket(ms) {
  if (ms < 250) return '<250ms';
  if (ms < 1000) return '250-1000ms';
  if (ms < 3000) return '1-3s';
  if (ms < 10000) return '3-10s';
  return '>=10s';
}

/**
 * Collect signals for a catalogue resolution with full resilience controls.
 * Injected fetch/execSync defaults to the real globals so tests can mock.
 * Returns { signals, telemetry }.
 */
export async function runFetchSignals(resolution, opts = {}) {
  const {
    maxItems = MAX_ITEMS,
    chunkSize = CHUNK_SIZE,
    fetchImpl = fetch,
    execSyncImpl = execSync,
    existingSignals = {},
    onLog = (m) => console.log(m),
  } = opts;

  const slugs = Object.keys(resolution);
  const catHash = catalogueHash(resolution);
  const failures = [];
  const latencies = [];
  let success = 0;
  let skipped = 0;
  let budgetSkipped = 0;

  const signals = { ...existingSignals };
  const fetchedAt = new Date().toISOString();

  onLog(`[signals] catalogue=${catHash} items=${slugs.length} budget=${maxItems}`);

  // Per-run item budget: cap total items processed per run.
  const toProcess = slugs.slice(0, maxItems);
  if (slugs.length > maxItems) {
    budgetSkipped = slugs.length - maxItems;
    onLog(
      `[signals] item budget exceeded: ${budgetSkipped} item(s) skipped (set maxItems>=${slugs.length} to process all)`
    );
  }

  // Concurrency cap: process in bounded chunks. Currently sequential within a
  // chunk; the chunk boundary is the explicit fan-out bound if this is ever
  // parallelized (do NOT replace with unbounded Promise.all).
  let i = 0;
  for (let start = 0; start < toProcess.length; start += chunkSize) {
    const chunk = toProcess.slice(start, start + chunkSize);
    for (const slug of chunk) {
      const meta = resolution[slug];
      const { directory, github, registry, pkg } = meta;
      const sig = itemSignature(meta);

      // Idempotency: reuse stored signal when the provider signature is
      // unchanged (no re-fetch for unchanged items on re-run).
      const prior = signals[slug];
      if (prior && prior.sig === sig) {
        skipped++;
        signals[slug] = { ...prior, reused: true };
        continue;
      }

      const t0 = Date.now();
      const gh = github
        ? ghRepo(github, {
            execSyncImpl,
            onFail: (f) => failures.push({ slug, provider: 'github', ...f }),
          })
        : null;
      const dl = await weeklyDownloads(registry, pkg, {
        fetchImpl,
        onFail: (f) => failures.push({ slug, provider: registry ?? 'registry', ...f }),
      });
      const elapsed = Date.now() - t0;
      latencies.push(elapsed);

      signals[slug] = {
        directory,
        github: github ?? null,
        registry: registry ?? null,
        pkg: pkg ?? null,
        sig,
        stars: gh?.stars ?? null,
        lastPush: gh?.pushed ?? null,
        weeklyDownloads: dl,
        fetchedAt,
      };
      if (gh || dl != null) success++;
      if (++i % 40 === 0) onLog(`[signals]   ${i}/${toProcess.length}`);
    }
  }

  const buckets = {};
  for (const ms of latencies) {
    const b = latencyBucket(ms);
    buckets[b] = (buckets[b] ?? 0) + 1;
  }

  const telemetry = {
    catalogueHash: catHash,
    totalItems: slugs.length,
    processed: toProcess.length,
    success,
    failed: failures.length,
    reused: skipped,
    budgetSkipped,
    failureReasons: budgetSkipped > 0 ? [`item budget exceeded (${budgetSkipped} skipped)`] : [],
    latencyBuckets: buckets,
    // Secret-free: only status codes + provider names, never tokens.
    failures: failures.map((f) => ({
      slug: f.slug,
      provider: f.provider,
      status: f.status ?? null,
      timedOut: f.timedOut ?? false,
    })),
  };
  onLog(
    `[signals] done processed=${telemetry.processed} success=${success} failed=${failures.length} reused=${skipped} budgetSkipped=${budgetSkipped}`
  );
  return { signals, telemetry };
}

// --- Scoring (unchanged) ---------------------------------------------------
function idxOf(s) {
  if (s.weeklyDownloads && s.weeklyDownloads > 0) return Math.log10(s.weeklyDownloads);
  if (s.stars && s.stars > 0) return Math.log10(s.stars) + STARS_BRIDGE;
  return null;
}

function scoreSignals(signals) {
  const byDir = {};
  for (const [slug, s] of Object.entries(signals)) {
    if (!byDir[s.directory]) byDir[s.directory] = [];
    byDir[s.directory].push([slug, idxOf(s)]);
  }
  const ecoScores = {}; // slug -> 1..5
  const grounded = [];
  for (const items of Object.values(byDir)) {
    const ranked = items.filter(([, idx]) => idx != null).sort((a, b) => b[1] - a[1]);
    const n = ranked.length;
    ranked.forEach(([slug], rank) => {
      const score = Math.max(1, Math.min(5, 5 - Math.floor((rank * 5) / n)));
      ecoScores[slug] = score;
      grounded.push(slug);
    });
  }
  return { ecoScores, grounded, directories: Object.keys(byDir).length };
}

// --- CLI entry point -------------------------------------------------------
async function main() {
  const resolution = JSON.parse(readFileSync(RES, 'utf8'));
  const existing = existsSync(SIGNALS) ? JSON.parse(readFileSync(SIGNALS, 'utf8')) : {};
  const { signals, telemetry } = await runFetchSignals(resolution, { existingSignals: existing });

  writeFileSync(SIGNALS, `${JSON.stringify(signals, null, 1)}\n`);
  console.log(`[signals] wrote ${SIGNALS}`);

  const { ecoScores, grounded, directories } = scoreSignals(signals);
  const overrides = existsSync(OVERRIDES) ? JSON.parse(readFileSync(OVERRIDES, 'utf8')) : {};
  for (const [slug, score] of Object.entries(ecoScores)) {
    overrides[slug] = { ...(overrides[slug] ?? {}), ecosystem: score };
  }
  writeFileSync(OVERRIDES, `${JSON.stringify(overrides, null, 1)}\n`);
  writeFileSync(GROUNDED, `${JSON.stringify(grounded.sort(), null, 1)}\n`);
  console.log(
    `[signals] grounded ecosystem for ${grounded.length} items across ${directories} directories; merged into overrides`
  );
  // Bounded, secret-free telemetry summary (no tokens / API keys).
  console.log(`[signals] telemetry ${JSON.stringify(telemetry)}`);
}

// Only run CLI when executed directly, not when imported by tests.
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch((e) => {
    console.error(`[signals] fatal: ${e?.message ?? e}`);
    process.exitCode = 1;
  });
}
