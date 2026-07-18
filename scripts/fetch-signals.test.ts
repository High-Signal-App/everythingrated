import assert from 'node:assert/strict';

import { test } from 'vitest';

import {
  fetchWithRetry,
  getJson,
  ghRepo,
  weeklyDownloads,
  runFetchSignals,
  itemSignature,
  catalogueHash,
  isRetryableStatus,
  jitterBackoff,
} from './fetch-signals.mjs';

// --- Fake fetch / execSync helpers (no real network) -----------------------

/** Build a Response-like object. */
const res = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

/**
 * Fake fetch that resolves with per-URL behavior, and rejects with an
 * AbortError when the request signal aborts (mirrors real fetch semantics).
 */
function makeFetch(behavior: (url: string) => ReturnType<typeof res> | undefined) {
  const calls: string[] = [];
  const fn = (url: string, init?: { signal?: AbortSignal }) =>
    new Promise<any>((resolve, reject) => {
      calls.push(url);
      const sig = init?.signal;
      if (sig) {
        sig.addEventListener(
          'abort',
          () => {
            const e = new Error('The operation was aborted');
            e.name = 'AbortError';
            reject(e);
          },
          { once: true }
        );
      }
      const r = behavior(url);
      if (r && !sig?.aborted) resolve(r);
    });
  return { fn, calls };
}

// --- fetchWithRetry: classification + retry policy --------------------------

test('fetchWithRetry succeeds on 200', async () => {
  const { fn, calls } = makeFetch(() => res(200, { ok: true }));
  const out = await fetchWithRetry('https://x/y', {
    fetchImpl: fn,
    maxAttempts: 2,
    timeoutMs: 1000,
  });
  assert.equal(out.ok, true);
  assert.equal(calls.length, 1);
});

test('fetchWithRetry retries 429 then fails terminal', async () => {
  const { fn, calls } = makeFetch(() => res(429, {}));
  await assert.rejects(
    fetchWithRetry('https://x/y', { fetchImpl: fn, maxAttempts: 2, timeoutMs: 1000 }),
    (e: any) => e.status === 429 && e.retryable === false
  );
  // 2 attempts only — bounded, no infinite retry loop.
  assert.equal(calls.length, 2);
});

test('fetchWithRetry retries repeated 5xx then fails terminal', async () => {
  const { fn, calls } = makeFetch(() => res(503, {}));
  await assert.rejects(
    fetchWithRetry('https://x/y', { fetchImpl: fn, maxAttempts: 2, timeoutMs: 1000 }),
    (e: any) => e.status === 503 && e.retryable === false
  );
  assert.equal(calls.length, 2);
});

test('fetchWithRetry fails fast on non-retryable 4xx (no retry)', async () => {
  const { fn, calls } = makeFetch(() => res(404, {}));
  await assert.rejects(
    fetchWithRetry('https://x/y', { fetchImpl: fn, maxAttempts: 2, timeoutMs: 1000 }),
    (e: any) => e.status === 404 && e.retryable === false
  );
  assert.equal(calls.length, 1);
});

test('fetchWithRetry treats slow provider as timeout and retries before failing', async () => {
  // Never resolves -> only the AbortSignal fires.
  const { fn, calls } = makeFetch(() => undefined);
  await assert.rejects(
    fetchWithRetry('https://x/y', { fetchImpl: fn, maxAttempts: 2, timeoutMs: 30 }),
    (e: any) => e.timedOut === true && e.retryable === true
  );
  assert.equal(calls.length, 2);
});

test('fetchWithRetry recovers on second attempt after a 5xx', async () => {
  let n = 0;
  const { fn, calls } = makeFetch(() => (n++ === 0 ? res(503, {}) : res(200, { ok: true })));
  const out = await fetchWithRetry('https://x/y', {
    fetchImpl: fn,
    maxAttempts: 2,
    timeoutMs: 1000,
  });
  assert.equal(out.ok, true);
  assert.equal(calls.length, 2);
});

// --- getJson: degraded mode returns null + records failure ------------------

test('getJson returns null and records failure on terminal 5xx', async () => {
  const { fn } = makeFetch(() => res(500, {}));
  const failures: any[] = [];
  const out = await getJson(
    'https://x/y',
    { fetchImpl: fn, maxAttempts: 2, timeoutMs: 1000 },
    (f) => failures.push(f)
  );
  assert.equal(out, null);
  assert.equal(failures.length, 1);
  assert.equal(failures[0].status, 500);
});

// --- ghRepo: execSync timeout flag + degraded mode --------------------------

test('ghRepo passes a timeout to execSync and degrades on failure', () => {
  let receivedOpts: any = null;
  const execSyncImpl = (_cmd: string, opts: any) => {
    receivedOpts = opts;
    throw new Error('boom');
  };
  const failures: any[] = [];
  const out = ghRepo('o/r', { timeoutMs: 8000, execSyncImpl, onFail: (f) => failures.push(f) });
  assert.equal(out, null);
  assert.equal(receivedOpts.timeout, 8000);
  assert.equal(failures.length, 1);
});

test('ghRepo parses gh CLI output', () => {
  const execSyncImpl = () => '{"stars":1234,"pushed":"2026-01-01T00:00:00Z"}';
  const out = ghRepo('o/r', { execSyncImpl });
  assert.deepEqual(out, { stars: 1234, pushed: '2026-01-01T00:00:00Z' });
});

// --- weeklyDownloads: preserves politeness sleeps + uses resilient fetch ----

test('weeklyDownloads returns npm downloads on success', async () => {
  const { fn } = makeFetch(() => res(200, { downloads: 42 }));
  const dl = await weeklyDownloads('npm', 'pkg', { fetchImpl: fn, timeoutMs: 1000 });
  assert.equal(dl, 42);
});

test('weeklyDownloads degrades to null on provider failure', async () => {
  const { fn } = makeFetch(() => res(500, {}));
  const dl = await weeklyDownloads('npm', 'pkg', { fetchImpl: fn, timeoutMs: 1000 });
  assert.equal(dl, null);
});

// --- runFetchSignals: budget, idempotency, telemetry ------------------------

const cat = (n: number) => {
  const r: Record<string, any> = {};
  for (let i = 0; i < n; i++)
    r[`item-${i}`] = { directory: 'ai-dev-tools', github: null, registry: 'npm', pkg: `p${i}` };
  return r;
};

test('runFetchSignals enforces per-run item budget', async () => {
  const { fn, calls } = makeFetch(() => res(200, { downloads: 1 }));
  const { telemetry } = await runFetchSignals(cat(3), {
    maxItems: 2,
    chunkSize: 10,
    fetchImpl: fn,
    execSyncImpl: () => '{"stars":1,"pushed":"x"}',
    onLog: () => {},
  });
  assert.equal(telemetry.processed, 2);
  assert.equal(telemetry.budgetSkipped, 1);
  assert.ok(telemetry.failureReasons.some((r: string) => r.includes('budget')));
  // Only budgeted items hit the network.
  assert.equal(calls.length, 2);
});

test('runFetchSignals idempotency: re-run reuses unchanged items (no re-fetch)', async () => {
  const { fn, calls } = makeFetch(() => res(200, { downloads: 1 }));
  const resolution = cat(2);
  const first = await runFetchSignals(resolution, {
    fetchImpl: fn,
    execSyncImpl: () => '{"stars":1,"pushed":"x"}',
    onLog: () => {},
  });
  assert.equal(first.telemetry.reused, 0);
  const firstCalls = calls.length;

  // Second run with existingSignals from the first: signatures unchanged.
  const second = await runFetchSignals(resolution, {
    fetchImpl: fn,
    execSyncImpl: () => '{"stars":1,"pushed":"x"}',
    existingSignals: first.signals,
    onLog: () => {},
  });
  assert.equal(second.telemetry.reused, 2);
  assert.equal(second.telemetry.processed, 2);
  // No new network calls for unchanged items.
  assert.equal(calls.length, firstCalls);
});

test('runFetchSignals telemetry is bounded and secret-free', async () => {
  const { fn } = makeFetch(() => res(200, { downloads: 1 }));
  const { telemetry } = await runFetchSignals(cat(1), {
    fetchImpl: fn,
    execSyncImpl: () => '{"stars":1,"pushed":"x"}',
    onLog: () => {},
  });
  const serialized = JSON.stringify(telemetry);
  // No tokens / keys / auth headers leak into telemetry.
  assert.ok(!/token|key|auth|bearer/i.test(serialized));
  assert.ok(telemetry.latencyBuckets);
  assert.equal(telemetry.catalogueHash.length, 16);
});

test('runFetchSignals does not amplify 429 into an infinite retry loop', async () => {
  const { fn, calls } = makeFetch(() => res(429, {}));
  const { telemetry } = await runFetchSignals(cat(1), {
    fetchImpl: fn,
    execSyncImpl: () => '{"stars":1,"pushed":"x"}',
    onLog: () => {},
  });
  // 1 item * (1 npm fetch with 2 attempts) = 2 fetch calls. Bounded.
  assert.equal(calls.length, 2);
  assert.equal(telemetry.failed, 1);
});

// --- pure helpers ----------------------------------------------------------

test('isRetryableStatus classifies 429 and 5xx as retryable', () => {
  assert.ok(isRetryableStatus(429));
  assert.ok(isRetryableStatus(500));
  assert.ok(isRetryableStatus(503));
  assert.ok(!isRetryableStatus(200));
  assert.ok(!isRetryableStatus(404));
});

test('jitterBackoff stays within [0, base*2^(attempt-1))', () => {
  for (let a = 1; a <= 4; a++) {
    const v = jitterBackoff(a, 500);
    assert.ok(v >= 0 && v < 500 * 2 ** (a - 1));
  }
});

test('itemSignature is stable for identical inputs and differs on change', () => {
  const a = itemSignature({ github: 'o/r', registry: 'npm', pkg: 'p' });
  const b = itemSignature({ github: 'o/r', registry: 'npm', pkg: 'p' });
  const c = itemSignature({ github: 'o/r', registry: 'npm', pkg: 'p2' });
  assert.equal(a, b);
  assert.notEqual(a, c);
});

test('catalogueHash is deterministic for a given resolution', () => {
  const r = cat(2);
  assert.equal(catalogueHash(r), catalogueHash(r));
  assert.notEqual(catalogueHash(r), catalogueHash(cat(3)));
});
