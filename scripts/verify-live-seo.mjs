#!/usr/bin/env node

const sitemapUrl = process.argv[2];
const concurrency = Number(process.env.SEO_VERIFY_CONCURRENCY ?? 12);

if (!sitemapUrl) {
  console.error('Usage: node scripts/verify-live-seo.mjs <sitemap-url>');
  process.exit(2);
}

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchDirect(url) {
  let lastError;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'manual',
        headers: { 'user-agent': 'FleetSeoVerifier/1.0' },
        signal: AbortSignal.timeout(20_000),
      });
      if (response.status !== 429 && response.status < 500) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(attempt * 500);
  }
  throw lastError;
}

function locations(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
    match[1].replaceAll('&amp;', '&')
  );
}

async function collectUrls(url, seen = new Set()) {
  if (seen.has(url)) return [];
  seen.add(url);
  const response = await fetchDirect(url);
  if (response.status !== 200 || response.headers.has('location')) {
    throw new Error(`Sitemap must return direct 200: ${url} (${response.status})`);
  }
  const xml = await response.text();
  const entries = locations(xml);
  if (xml.includes('<sitemapindex')) {
    return (await Promise.all(entries.map((entry) => collectUrls(entry, seen)))).flat();
  }
  return entries;
}

function canonicalFrom(html) {
  const tag = html.match(/<link\b[^>]*\brel=(['"])canonical\1[^>]*>/i)?.[0];
  return tag?.match(/\bhref=(['"])(.*?)\1/i)?.[2] ?? null;
}

function openGraphUrlFrom(html) {
  const tag = html.match(/<meta\b[^>]*\bproperty=(['"])og:url\1[^>]*>/i)?.[0];
  return tag?.match(/\bcontent=(['"])(.*?)\1/i)?.[2] ?? null;
}

async function mapLimit(values, limit, task) {
  const results = new Array(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await task(values[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, worker));
  return results;
}

const urls = await collectUrls(sitemapUrl);
const issues = (
  await mapLimit(urls, concurrency, async (url) => {
    try {
      const response = await fetchDirect(url);
      if (response.status !== 200 || response.headers.has('location')) {
        return `${url}: expected direct 200, got ${response.status}`;
      }
      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('text/html')) return null;
      const html = await response.text();
      const canonical = canonicalFrom(html);
      const expected = new URL(url).href;
      if (!canonical) return `${url}: missing canonical`;
      if (new URL(canonical, url).href !== expected) {
        return `${url}: canonical is ${canonical}`;
      }
      const openGraphUrl = openGraphUrlFrom(html);
      if (!openGraphUrl) return `${url}: missing og:url`;
      if (new URL(openGraphUrl, url).href !== expected) {
        return `${url}: og:url is ${openGraphUrl}`;
      }
      return null;
    } catch (error) {
      return `${url}: ${error.message}`;
    }
  })
).filter(Boolean);

if (issues.length > 0) {
  console.error(`SEO verification failed: ${issues.length}/${urls.length} sitemap URLs`);
  for (const issue of issues.slice(0, 50)) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(
  `SEO verification passed: ${urls.length}/${urls.length} direct URLs with exact canonicals`
);
